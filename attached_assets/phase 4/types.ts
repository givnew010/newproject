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

// ══════════════════════════════════════════════════════════════════════════════
// أنواع المخازن
// ══════════════════════════════════════════════════════════════════════════════
export interface DbWarehouse {
  id: number;
  name: string;
  location: string | null;
  capacity: number;
  manager_name: string | null;
  phone: string | null;
  color: string;
  description: string | null;
  is_active: number;
  created_at: string;
}

export interface WarehouseWithStats extends DbWarehouse {
  current_stock: number;         // مجموع كميات الأصناف في هذا المخزن
  items_count: number;           // عدد الأصناف المختلفة
  utilization_percentage: number; // نسبة الإشغال = current_stock / capacity * 100
}

// ══════════════════════════════════════════════════════════════════════════════
// أنواع الأصناف
// ══════════════════════════════════════════════════════════════════════════════
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface DbInventoryItem {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  selling_price: number;
  warehouse_id: number | null;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemWithStatus extends DbInventoryItem {
  status: StockStatus;           // محسوب تلقائياً
  warehouse_name: string | null; // اسم المخزن (من JOIN)
  stock_value: number;           // quantity × cost_price
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ─── فلاتر الأصناف ───────────────────────────────────────────────────────────
export interface InventoryQueryParams {
  search?: string;
  category?: string;
  status?: StockStatus;
  warehouse_id?: number;
  is_active?: number;
  sortBy?: "name" | "quantity" | "selling_price" | "cost_price" | "created_at" | "updated_at";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// أنواع حركات المخزون
// ══════════════════════════════════════════════════════════════════════════════
export type MovementType      = "in" | "out" | "adjustment";
export type MovementRefType   = "purchase" | "sale" | "return" | "manual";

export interface DbStockMovement {
  id: number;
  item_id: number;
  type: MovementType;
  quantity: number;
  balance_after: number;
  reference_type: MovementRefType | null;
  reference_id: number | null;
  note: string | null;
  created_by: number | null;
  created_at: string;
}

export interface StockMovementWithUser extends DbStockMovement {
  created_by_name: string | null; // اسم المستخدم (من JOIN)
}
