// ══════════════════════════════════════════════════════════════════════════════
// server/types.ts
// أنواع TypeScript المشتركة بين جميع ملفات الـ Backend
// ══════════════════════════════════════════════════════════════════════════════

// ─── أدوار المستخدمين ────────────────────────────────────────────────────────
export type UserRole = "admin" | "accountant" | "sales" | "warehouse";

// ─── نموذج المستخدم كما يُخزَّن في قاعدة البيانات ──────────────────────────
export interface DbUser {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: number; // 1 = نشط، 0 = معطّل
  created_at: string;
  last_login: string | null;
}

// ─── بيانات المستخدم التي تُعاد للـ Frontend (بدون password_hash) ─────────
export interface PublicUser {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  last_login: string | null;
}

// ─── payload المخزّن داخل JWT token ─────────────────────────────────────────
export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── تمديد Request الخاص بـ Express لإضافة حقل user ─────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── صيغة استجابات الـ API الموحّدة ─────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── بيانات إنشاء مستخدم جديد ───────────────────────────────────────────────
export interface CreateUserBody {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
}

// ─── بيانات تعديل مستخدم ────────────────────────────────────────────────────
export interface UpdateUserBody {
  full_name?: string;
  role?: UserRole;
  is_active?: number;
}
