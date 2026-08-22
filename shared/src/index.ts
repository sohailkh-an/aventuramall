import { z } from 'zod';

export type {
  Product,
  Category,
  User,
  Order,
  OrderItem,
  CartItem,
  Address,
  PayoutRequest,
  Payout,
  Session,
  Account,
  Verification,
  WishlistItem,
  CompareItem,
  Seller,
  SellerPackage,
  SellerPackagePurchase,
  SpreadPackage,
  SellerSpreadPackagePurchase,
  SellerFile,
  SellerProduct,
} from './generated/prisma/index.js';
export type * from './generated/prisma/index.js';

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
