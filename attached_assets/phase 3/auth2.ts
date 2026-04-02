// ══════════════════════════════════════════════════════════════════════════════
// server/middleware/auth.ts
// المهمة 3-3: Auth Middleware — التحقق من JWT وصلاحيات الأدوار
// ══════════════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload, UserRole } from "../types.js";

// مفتاح التوقيع — يُقرأ من متغيرات البيئة، وله قيمة احتياطية للتطوير فقط
const JWT_SECRET = process.env.JWT_SECRET ?? "almunsiq-dev-secret-change-in-production";

// ─── verifyToken ─────────────────────────────────────────────────────────────
/**
 * Middleware إلزامي يُطبَّق على جميع routes المحمية.
 *
 * يتوقع header بالشكل:
 *   Authorization: Bearer <token>
 *
 * عند النجاح: يُضيف req.user = { userId, username, role }
 * عند الفشل: يُعيد 401 مع رسالة واضحة
 */
export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // التحقق من وجود الـ header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "غير مصرح — يرجى تسجيل الدخول أولاً",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // فك تشفير الـ token والتحقق من صحته وصلاحيته
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // إضافة بيانات المستخدم للـ request لاستخدامها في الـ routes
    req.user = {
      userId:   decoded.userId,
      username: decoded.username,
      role:     decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "انتهت صلاحية الجلسة — يرجى تسجيل الدخول مجدداً",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: "رمز مصادقة غير صالح",
      });
      return;
    }

    // خطأ غير متوقع
    res.status(500).json({
      success: false,
      error: "خطأ داخلي في التحقق من الهوية",
    });
  }
}

// ─── checkRole ───────────────────────────────────────────────────────────────
/**
 * Middleware factory للتحقق من الدور.
 * يُستخدم دائماً بعد verifyToken.
 *
 * مثال:
 *   router.delete("/users/:id", verifyToken, checkRole("admin"), handler)
 *   router.get("/reports",      verifyToken, checkRole("admin","accountant"), handler)
 */
export function checkRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: "غير مصرح — بيانات المستخدم غير موجودة",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: `غير مسموح — هذا الإجراء يتطلب صلاحية: ${allowedRoles.join(" أو ")}`,
      });
      return;
    }

    next();
  };
}

// ─── generateToken ───────────────────────────────────────────────────────────
/**
 * دالة مساعدة لتوليد JWT token جديد.
 * تُستخدم في route تسجيل الدخول.
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(
    {
      userId:   payload.userId,
      username: payload.username,
      role:     payload.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export { JWT_SECRET };
