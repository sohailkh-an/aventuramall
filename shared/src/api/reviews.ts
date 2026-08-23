import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment is too long').optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
