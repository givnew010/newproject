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

// ─── أنواع المخازن والمخزون
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
  current_stock: number;
  items_count: number;
  utilization_percentage: number;
}

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

export interface InventoryItemWithStock extends DbInventoryItem {
  status: "in_stock" | "low_stock" | "out_of_stock";
  stock_value: number;
}

export type MovementType = "in" | "out";

export interface InventoryMovement {
  id: number;
  inventory_item_id: number;
  movement_type: MovementType;
  quantity: number;
  warehouse_id: number;
  user_id: number;
  note: string | null;
  created_at: string;
}

// ─── أنواع العملاء والموردين
export interface DbCustomer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  credit_limit: number;
  balance: number;
  notes: string | null;
  is_active: number;
  created_at: string;
}

export interface CustomerWithStats extends DbCustomer {
  total_invoices: number;
  total_paid: number;
  total_due: number;
}

export interface DbSupplier {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  tax_number: string | null;
  payment_terms: "فوري" | "أسبوعي" | "شهري" | "ثلاثة أشهر";
  balance: number;
  notes: string | null;
  is_active: number;
  created_at: string;
}

export interface SupplierWithStats extends DbSupplier {
  total_invoices: number;
  total_paid: number;
  total_due: number;
}

// ─── أنواع فواتير المبيعات
export interface DbSalesInvoice {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  date: string;
  due_date: string;
  status: "draft" | "confirmed" | "paid" | "partial" | "cancelled";
  payment_type: "cash" | "credit" | "partial";
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface SalesInvoiceWithDetails extends DbSalesInvoice {
  customer_name?: string;
  customer_phone?: string;
  items: SalesInvoiceItem[];
  remaining_amount: number;
}

export interface SalesInvoiceItem {
  id: number;
  invoice_id: number;
  item_id: number;
  item_name: string;
  item_sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

// ─── أنواع فواتير المشتريات
export interface DbPurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number | null;
  date: string;
  due_date: string;
  status: "draft" | "confirmed" | "paid" | "partial" | "cancelled";
  payment_type: "cash" | "credit" | "partial";
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseInvoiceWithDetails extends DbPurchaseInvoice {
  supplier_name?: string;
  supplier_phone?: string;
  items: PurchaseInvoiceItem[];
  remaining_amount: number;
}

export interface PurchaseInvoiceItem {
  id: number;
  invoice_id: number;
  item_id: number;
  item_name: string;
  item_sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

// ─── أنواع المدفوعات
export interface DbPayment {
  id: number;
  type: "sales" | "purchase";
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: "cash" | "bank" | "check";
  reference_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

// ─── أنواع الإعدادات
export interface DbSetting {
  key: string;
  value: string;
}


