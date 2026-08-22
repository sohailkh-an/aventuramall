import { z } from 'zod';

export type { ProductModel as Product } from './generated/prisma/models/Product.js';
export type { CategoryModel as Category } from './generated/prisma/models/Category.js';
export type { UserModel as User } from './generated/prisma/models/User.js';
export type { OrderModel as Order } from './generated/prisma/models/Order.js';
export type { OrderItemModel as OrderItem } from './generated/prisma/models/OrderItem.js';
export type { CartItemModel as CartItem } from './generated/prisma/models/CartItem.js';
export type { AddressModel as Address } from './generated/prisma/models/Address.js';
export type * from './generated/prisma/models.js';

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  images: z.array(z.string()).default([]),
  categoryId: z.string().min(1),
  stock: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  videoLink: z.string().optional(),
  descriptionImages: z.array(z.string()).default([]),
});

export const updateProductSchema = createProductSchema.partial();
