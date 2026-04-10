export type ItemStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  price?: number;
  barcode: string;
  unit?: string;
  expiry_date?: string;
  status: ItemStatus;
  notes?: string;
  warehouse_id?: number;
}

export interface Stat {
  label: string;
  value: string;
  change?: string;
  icon: string;
  color: string;
}

export interface InvoiceLineItem {
  id: string;
  inventoryItemId?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: string;
  notes?: string;
  items: InvoiceLineItem[];
  totalAmount: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  notes?: string;
  items: InvoiceLineItem[];
  totalAmount: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  capacity: number;
  notes?: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
}

export type UserRole = 'admin' | 'manager' | 'accountant' | 'warehouse' | 'sales' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
  notes?: string;
}

// User shape returned by auth endpoints (keeps both snake_case and camelCase optional)
export interface AuthUser {
  id: number | string;
  username?: string;
  full_name?: string;
  fullName?: string;
  role?: string;
  email?: string;
}
