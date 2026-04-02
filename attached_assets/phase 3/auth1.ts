// ══════════════════════════════════════════════════════════════════════════════
// server/routes/auth.ts
// المهمة 3-1: POST /api/v1/auth/login
// المهمة 3-2: GET  /api/v1/auth/me
//             POST /api/v1/auth/logout
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import db from "../db.js";
import { verifyToken, generateToken } from "../middleware/auth.js";
import type { DbUser, PublicUser } from "../types.js";

const router = Router();

// ─── Zod schemas للتحقق من البيانات الواردة ──────────────────────────────────

const loginSchema = z.object({
  username: z
    .string({ required_error: "اسم المستخدم مطلوب" })
    .min(1, "اسم المستخدم لا يمكن أن يكون فارغاً")
    .max(50, "اسم المستخدم طويل جداً"),
  password: z
    .string({ required_error: "كلمة المرور مطلوبة" })
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

// ─── دالة مساعدة: تحويل DbUser → PublicUser (إخفاء password_hash) ──────────
function toPublicUser(user: DbUser): PublicUser {
  const { password_hash: _omit, ...publicData } = user;
  return publicData;
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/login
// ══════════════════════════════════════════════════════════════════════════════
/**
 * تسجيل الدخول
 *
 * Body: { username: string, password: string }
 *
 * Response 200:
 * {
 *   success: true,
 *   data: {
 *     token: "eyJ...",
 *     user: { id, username, full_name, role, is_active, ... }
 *   }
 * }
 *
 * Response 400: بيانات غير صالحة (Zod)
 * Response 401: اسم مستخدم أو كلمة مرور خاطئة
 * Response 403: الحساب معطّل
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  // ── 1. التحقق من صحة البيانات الواردة ──────────────────────────────────
  let parsed: z.infer<typeof loginSchema>;
  try {
    parsed = loginSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: "بيانات غير صالحة",
        details: err.errors.map((e) => ({
          field:   e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    throw err;
  }

  const { username, password } = parsed;

  // ── 2. البحث عن المستخدم في قاعدة البيانات ─────────────────────────────
  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as DbUser | undefined;

  // نُعيد نفس الرسالة سواء كان المستخدم غير موجود أو الباسورد خاطئ
  // (لتجنب كشف أسماء المستخدمين عبر رسائل الخطأ)
  if (!user) {
    res.status(401).json({
      success: false,
      error: "اسم المستخدم أو كلمة المرور غير صحيحة",
    });
    return;
  }

  // ── 3. التحقق من أن الحساب نشط ────────────────────────────────────────
  if (!user.is_active) {
    res.status(403).json({
      success: false,
      error: "هذا الحساب معطّل. تواصل مع مدير النظام",
    });
    return;
  }

  // ── 4. مقارنة كلمة المرور بالـ hash ────────────────────────────────────
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    res.status(401).json({
      success: false,
      error: "اسم المستخدم أو كلمة المرور غير صحيحة",
    });
    return;
  }

  // ── 5. تحديث last_login ────────────────────────────────────────────────
  db.prepare(`
    UPDATE users
    SET last_login = datetime('now', 'localtime')
    WHERE id = ?
  `).run(user.id);

  // ── 6. توليد JWT token ──────────────────────────────────────────────────
  const token = generateToken({
    userId:   user.id,
    username: user.username,
    role:     user.role,
  });

  // ── 7. إعادة الاستجابة ──────────────────────────────────────────────────
  res.status(200).json({
    success: true,
    data: {
      token,
      user: toPublicUser(user),
    },
    message: `مرحباً ${user.full_name}`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/auth/me
// ══════════════════════════════════════════════════════════════════════════════
/**
 * إعادة بيانات المستخدم الحالي والتحقق من صحة الـ token
 * يستخدمه الـ Frontend عند تحميل التطبيق للتحقق من الجلسة
 *
 * Headers: Authorization: Bearer <token>
 *
 * Response 200: { success: true, data: { user: PublicUser } }
 * Response 401: token غير صالح أو منتهي
 */
router.get("/me", verifyToken, (req: Request, res: Response): void => {
  const userId = req.user!.userId;

  // جلب أحدث بيانات المستخدم من قاعدة البيانات
  const user = db
    .prepare("SELECT * FROM users WHERE id = ? AND is_active = 1")
    .get(userId) as DbUser | undefined;

  if (!user) {
    res.status(401).json({
      success: false,
      error: "المستخدم غير موجود أو تم تعطيل حسابه",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: toPublicUser(user),
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/logout
// ══════════════════════════════════════════════════════════════════════════════
/**
 * تسجيل الخروج
 *
 * JWT stateless بطبيعته — الـ logout الفعلي يتم بحذف الـ token من الـ Frontend.
 * هذا الـ endpoint موجود للاتساق وللسماح بتسجيل عملية الخروج إذا أُريد لاحقاً.
 *
 * Response 200: { success: true, message: "تم تسجيل الخروج بنجاح" }
 */
router.post("/logout", verifyToken, (req: Request, res: Response): void => {
  // في المستقبل يمكن إضافة blacklist للـ tokens هنا إذا احتجنا
  res.status(200).json({
    success: true,
    message: "تم تسجيل الخروج بنجاح",
  });
});

export default router;

// ملاحظة هامة جداَ: الملف auth2.ts هو تكلمة للمهام اي ان auth1.ts + auth2.ts = auth.ts