import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { createReviewSchema, reviewQuerySchema } from '@aventuramall/shared';

export default async function reviewRoutes(fastify: FastifyInstance) {
  // GET /api/reviews/:sellerProductId - Public route to fetch reviews
  fastify.get('/api/products/:productId/reviews', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const { page, limit } = reviewQuerySchema.parse(request.query);
    const skip = (page - 1) * limit;

    // Find the seller products for this global product
    const sellerProducts = await prisma.sellerProduct.findMany({
      where: { sourceProductId: productId },
      select: { id: true }
    });
    
    const sellerProductIds = sellerProducts.map(sp => sp.id);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { sellerProductId: { in: sellerProductIds } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { sellerProductId: { in: sellerProductIds } } }),
    ]);

    return reply.send({
      data: reviews,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // POST /api/reviews - Create a new review
  fastify.post(
    '/api/reviews',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const user = (request as any).user;
      const body = createReviewSchema.parse(request.body);

      // Find a seller product for this global product
      // We'll just attach it to the first seller product we find for simplicity,
      // or if they bought it, we could look up the order. But since anyone logged in can review:
      const sellerProduct = await prisma.sellerProduct.findFirst({
        where: { sourceProductId: body.productId },
      });

      if (!sellerProduct) {
        return reply.status(404).send({ error: 'This product is not currently sold by any seller.' });
      }

      // Check if user already reviewed this product
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: user.id,
          sellerProductId: sellerProduct.id,
        },
      });

      if (existingReview) {
        return reply.status(400).send({ error: 'You have already reviewed this product' });
      }

      // Create review and update stats within a transaction
      const review = await prisma.$transaction(async (tx) => {
        const newReview = await tx.review.create({
          data: {
            userId: user.id,
            sellerProductId: sellerProduct.id,
            rating: body.rating,
            comment: body.comment,
          },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        });

        // Recalculate stats
        const stats = await tx.review.aggregate({
          where: { sellerProductId: sellerProduct.id },
          _avg: { rating: true },
          _count: { id: true },
        });

        await tx.sellerProduct.update({
          where: { id: sellerProduct.id },
          data: {
            averageRating: stats._avg.rating || 0,
            reviewCount: stats._count.id || 0,
          },
        });

        return newReview;
      });

      return reply.status(201).send({ data: review });
    }
  );
}
