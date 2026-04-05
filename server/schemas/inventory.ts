import { z } from 'zod';

export const createInventorySchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().min(1).optional().nullable(),
  barcode: z.string().trim().max(100).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  unit: z.string().trim().max(20).optional().default('pcs'),
  quantity: z.number().nonnegative().optional().default(0),
  min_quantity: z.number().nonnegative().optional().default(0),
  cost_price: z.number().nonnegative().optional().default(0),
  selling_price: z.number().nonnegative().optional().default(0),
  warehouse_id: z.number().int().positive().optional().nullable(),
  is_active: z.number().int().min(0).max(1).optional().default(1),
});

export const updateInventorySchema = createInventorySchema.partial();
