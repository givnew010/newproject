export type ItemStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  price: number;
  barcode: string;
  status: ItemStatus;
  notes?: string;
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
