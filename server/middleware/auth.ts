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
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "غير مصرح — يرجى تسجيل الدخول أولاً" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      userId:   decoded.userId,
      username: decoded.username,
      role:     decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: "انتهت صلاحية الجلسة — يرجى تسجيل الدخول مجدداً" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: "رمز مصادقة غير صالح" });
      return;
    }

    res.status(500).json({ success: false, error: "خطأ داخلي في التحقق من الهوية" });
  }
}

// ─── checkRole ───────────────────────────────────────────────────────────────
export function checkRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, error: "غير مصرح — بيانات المستخدم غير موجودة" });
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
