// ══════════════════════════════════════════════════════════════════════════════
// server/routes/users.ts
// المهمة 3-4: CRUD إدارة المستخدمين (admin فقط)
//
// GET    /api/v1/users          — قائمة المستخدمين
// GET    /api/v1/users/:id      — تفاصيل مستخدم واحد
// POST   /api/v1/users          — إنشاء مستخدم جديد
// PUT    /api/v1/users/:id      — تعديل بيانات المستخدم أو دوره
// PUT    /api/v1/users/:id/password — تغيير كلمة المرور
// DELETE /api/v1/users/:id      — تعطيل المستخدم (soft delete)
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import db from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type { DbUser, PublicUser } from "../types.js";

const router = Router();

// ─── جميع routes تتطلب: تسجيل الدخول + دور admin ───────────────────────────
router.use(verifyToken, checkRole("admin"));

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const roleEnum = z.enum(["admin", "accountant", "sales", "warehouse"], {
  errorMap: () => ({
    message: "الدور يجب أن يكون: admin, accountant, sales, أو warehouse",
  }),
});

/** Schema إنشاء مستخدم جديد */
const createUserSchema = z.object({
  username: z
    .string({ required_error: "اسم المستخدم مطلوب" })
    .min(3,  "اسم المستخدم 3 أحرف على الأقل")
    .max(50, "اسم المستخدم 50 حرفاً كحد أقصى")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط"
    ),
  password: z
    .string({ required_error: "كلمة المرور مطلوبة" })
    .min(6,   "كلمة المرور 6 أحرف على الأقل")
    .max(100, "كلمة المرور طويلة جداً"),
  full_name: z
    .string({ required_error: "الاسم الكامل مطلوب" })
    .min(2,  "الاسم الكامل حرفان على الأقل")
    .max(100,"الاسم الكامل طويل جداً"),
  role: roleEnum,
});

/** Schema تعديل مستخدم (كل الحقول اختيارية) */
const updateUserSchema = z.object({
  full_name: z
    .string()
    .min(2,   "الاسم الكامل حرفان على الأقل")
    .max(100, "الاسم الكامل طويل جداً")
    .optional(),
  role: roleEnum.optional(),
  is_active: z
    .number()
    .int()
    .min(0)
    .max(1)
    .optional(),
});

/** Schema تغيير كلمة المرور */
const changePasswordSchema = z.object({
  new_password: z
    .string({ required_error: "كلمة المرور الجديدة مطلوبة" })
    .min(6,   "كلمة المرور 6 أحرف على الأقل")
    .max(100, "كلمة المرور طويلة جداً"),
  confirm_password: z
    .string({ required_error: "تأكيد كلمة المرور مطلوب" }),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: "كلمة المرور وتأكيدها غير متطابقَين",
    path: ["confirm_password"],
  }
);

// ─── دوال مساعدة ─────────────────────────────────────────────────────────────

/** تحويل DbUser → PublicUser بحذف password_hash */
function toPublicUser(user: DbUser): PublicUser {
  const { password_hash: _omit, ...publicData } = user;
  return publicData;
}

/** معالجة موحّدة لأخطاء Zod */
function handleZodError(err: ZodError, res: Response): void {
  res.status(400).json({
    success: false,
    error: "بيانات غير صالحة",
    details: err.errors.map((e) => ({
      field:   e.path.join("."),
      message: e.message,
    })),
  });
}

/** التحقق من أن المعرّف رقم صحيح */
function parseId(param: string): number | null {
  const id = parseInt(param, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/users
// قائمة جميع المستخدمين مع دعم الفلترة
// ══════════════════════════════════════════════════════════════════════════════
router.get("/", (req: Request, res: Response): void => {
  const { role, is_active, search } = req.query;

  // بناء الاستعلام ديناميكياً بناءً على الفلاتر المُرسلة
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (role && typeof role === "string") {
    conditions.push("role = ?");
    params.push(role);
  }

  if (is_active !== undefined) {
    conditions.push("is_active = ?");
    params.push(is_active === "true" || is_active === "1" ? 1 : 0);
  }

  if (search && typeof search === "string" && search.trim()) {
    conditions.push("(username LIKE ? OR full_name LIKE ?)");
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  const whereClause = conditions.length > 0
    ? "WHERE " + conditions.join(" AND ")
    : "";

  const users = db
    .prepare(`
      SELECT id, username, full_name, role, is_active, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
    `)
    .all(...params) as PublicUser[];

  res.status(200).json({
    success: true,
    data: {
      users,
      total: users.length,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/users/:id
// تفاصيل مستخدم واحد
// ══════════════════════════════════════════════════════════════════════════════
router.get("/:id", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المستخدم غير صالح" });
    return;
  }

  const user = db
    .prepare(`
      SELECT id, username, full_name, role, is_active, created_at, last_login
      FROM users
      WHERE id = ?
    `)
    .get(id) as PublicUser | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: "المستخدم غير موجود" });
    return;
  }

  res.status(200).json({ success: true, data: { user } });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/users
// إنشاء مستخدم جديد
// ══════════════════════════════════════════════════════════════════════════════
router.post("/", async (req: Request, res: Response): Promise<void> => {
  // ── 1. التحقق من صحة البيانات ──────────────────────────────────────────
  let parsed: z.infer<typeof createUserSchema>;
  try {
    parsed = createUserSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) { handleZodError(err, res); return; }
    throw err;
  }

  const { username, password, full_name, role } = parsed;

  // ── 2. التحقق من عدم تكرار اسم المستخدم ───────────────────────────────
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);

  if (existing) {
    res.status(409).json({
      success: false,
      error: `اسم المستخدم "${username}" مستخدم بالفعل`,
    });
    return;
  }

  // ── 3. تشفير كلمة المرور ───────────────────────────────────────────────
  const password_hash = await bcrypt.hash(password, 10);

  // ── 4. إدخال المستخدم الجديد ───────────────────────────────────────────
  const result = db
    .prepare(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `)
    .run(username, password_hash, full_name, role);

  const newUser = db
    .prepare(`
      SELECT id, username, full_name, role, is_active, created_at, last_login
      FROM users WHERE id = ?
    `)
    .get(result.lastInsertRowid) as PublicUser;

  res.status(201).json({
    success: true,
    data: { user: newUser },
    message: `تم إنشاء المستخدم "${username}" بنجاح`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/v1/users/:id
// تعديل بيانات المستخدم (الاسم، الدور، الحالة)
// ══════════════════════════════════════════════════════════════════════════════
router.put("/:id", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المستخدم غير صالح" });
    return;
  }

  // ── 1. التحقق من وجود المستخدم ────────────────────────────────────────
  const existingUser = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as DbUser | undefined;

  if (!existingUser) {
    res.status(404).json({ success: false, error: "المستخدم غير موجود" });
    return;
  }

  // ── 2. التحقق من صحة البيانات ─────────────────────────────────────────
  let parsed: z.infer<typeof updateUserSchema>;
  try {
    parsed = updateUserSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) { handleZodError(err, res); return; }
    throw err;
  }

  // ── 3. حماية خاصة: منع تعطيل آخر admin نشط في النظام ──────────────────
  if (parsed.is_active === 0 || parsed.role !== "admin") {
    if (existingUser.role === "admin") {
      const activeAdminCount = (db
        .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND is_active = 1")
        .get() as { cnt: number }).cnt;

      const wouldRemoveAdmin =
        (parsed.is_active === 0 && existingUser.is_active === 1) ||
        (parsed.role && parsed.role !== "admin");

      if (wouldRemoveAdmin && activeAdminCount <= 1) {
        res.status(422).json({
          success: false,
          error: "لا يمكن إجراء هذا التعديل — يجب وجود مدير نشط واحد على الأقل في النظام",
        });
        return;
      }
    }
  }

  // ── 4. تطبيق التعديلات على الحقول المُرسلة فقط ────────────────────────
  const updates: string[] = [];
  const params: unknown[] = [];

  if (parsed.full_name !== undefined) {
    updates.push("full_name = ?");
    params.push(parsed.full_name);
  }
  if (parsed.role !== undefined) {
    updates.push("role = ?");
    params.push(parsed.role);
  }
  if (parsed.is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(parsed.is_active);
  }

  if (updates.length === 0) {
    res.status(400).json({
      success: false,
      error: "لم تُرسل أي بيانات للتعديل",
    });
    return;
  }

  params.push(id);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  // ── 5. إعادة البيانات المحدّثة ─────────────────────────────────────────
  const updatedUser = db
    .prepare(`
      SELECT id, username, full_name, role, is_active, created_at, last_login
      FROM users WHERE id = ?
    `)
    .get(id) as PublicUser;

  res.status(200).json({
    success: true,
    data: { user: updatedUser },
    message: "تم تحديث بيانات المستخدم بنجاح",
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/v1/users/:id/password
// تغيير كلمة مرور مستخدم
// ══════════════════════════════════════════════════════════════════════════════
router.put("/:id/password", async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المستخدم غير صالح" });
    return;
  }

  // ── 1. التحقق من وجود المستخدم ────────────────────────────────────────
  const user = db
    .prepare("SELECT id, username FROM users WHERE id = ?")
    .get(id) as Pick<DbUser, "id" | "username"> | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: "المستخدم غير موجود" });
    return;
  }

  // ── 2. التحقق من صحة البيانات ─────────────────────────────────────────
  let parsed: z.infer<typeof changePasswordSchema>;
  try {
    parsed = changePasswordSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) { handleZodError(err, res); return; }
    throw err;
  }

  // ── 3. تشفير كلمة المرور الجديدة ──────────────────────────────────────
  const newHash = await bcrypt.hash(parsed.new_password, 10);

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, id);

  res.status(200).json({
    success: true,
    message: `تم تغيير كلمة مرور المستخدم "${user.username}" بنجاح`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/users/:id
// تعطيل مستخدم (soft delete — لا حذف فعلي)
// ══════════════════════════════════════════════════════════════════════════════
router.delete("/:id", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المستخدم غير صالح" });
    return;
  }

  // ── 1. التحقق من وجود المستخدم ────────────────────────────────────────
  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as DbUser | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: "المستخدم غير موجود" });
    return;
  }

  // ── 2. منع حذف النفس ──────────────────────────────────────────────────
  if (id === req.user!.userId) {
    res.status(422).json({
      success: false,
      error: "لا يمكنك تعطيل حسابك الخاص",
    });
    return;
  }

  // ── 3. منع تعطيل آخر admin نشط ────────────────────────────────────────
  if (user.role === "admin" && user.is_active === 1) {
    const activeAdminCount = (db
      .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND is_active = 1")
      .get() as { cnt: number }).cnt;

    if (activeAdminCount <= 1) {
      res.status(422).json({
        success: false,
        error: "لا يمكن تعطيل هذا الحساب — هو المدير النشط الوحيد في النظام",
      });
      return;
    }
  }

  // ── 4. تعطيل الحساب (soft delete) ─────────────────────────────────────
  db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").run(id);

  res.status(200).json({
    success: true,
    message: `تم تعطيل حساب المستخدم "${user.username}" بنجاح`,
  });
});

export default router;
