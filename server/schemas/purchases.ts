import { z } from 'zod';

export const purchaseItemSchema = z.object({
  item_id: z.number().int().positive(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().default(0),
});

export const createPurchaseInvoiceSchema = z.object({
  supplier_id: z.number().int().positive().optional().nullable(),
  date: z.string().optional(),
  due_date: z.string().optional(),
  payment_type: z.enum(['cash', 'credit', 'partial']).default('credit'),
  items: z.array(purchaseItemSchema).min(1),
  discount_amount: z.number().nonnegative().optional().default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const updatePurchaseInvoiceSchema = createPurchaseInvoiceSchema.partial();
