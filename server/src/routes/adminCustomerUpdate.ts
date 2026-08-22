import { z } from 'zod';

const nullableStringFields = [
  'image', 'phone', 'package', 'bankName', 'bankAccountName', 'bankAccountNumber',
  'bankRoutingNumber', 'usdtLink', 'usdtAddress',
] as const;

export const adminCustomerUpdateSchema = z.object({
  email: z.string().email().optional(), name: z.string().min(1).max(255).optional(),
  image: z.string().optional(), phone: z.string().optional(), package: z.string().optional(),
  emailVerified: z.boolean().optional(), isBanned: z.boolean().optional(),
  cashPayment: z.boolean().optional(), bankPayment: z.boolean().optional(),
  bankName: z.string().optional(), bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(), bankRoutingNumber: z.string().optional(),
  usdtPayment: z.boolean().optional(), usdtLink: z.string().optional(), usdtAddress: z.string().optional(),
  addresses: z.array(z.object({
    id: z.string().min(1), label: z.string().min(1).max(100), street: z.string().min(1),
    city: z.string().min(1), state: z.string().min(1), zip: z.string().min(1), country: z.string().min(1),
    phone: z.string().optional(), isDefault: z.boolean(),
  })).optional(),
});

export type AdminCustomerUpdateInput = z.infer<typeof adminCustomerUpdateSchema>;

function normalizeNullableString(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeAdminCustomerUpdate(body: Omit<AdminCustomerUpdateInput, 'addresses'>) {
  const updateData: Record<string, string | boolean | null> = {};
  if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
  if (body.name !== undefined) updateData.name = body.name.trim();
  for (const field of nullableStringFields) {
    const value = normalizeNullableString(body[field]);
    if (value !== undefined) updateData[field] = value;
  }
  for (const field of ['emailVerified', 'isBanned', 'cashPayment', 'bankPayment', 'usdtPayment'] as const) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }
  return updateData;
}
