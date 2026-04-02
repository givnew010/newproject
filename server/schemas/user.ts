import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

export const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'accountant', 'sales', 'warehouse']),
});
