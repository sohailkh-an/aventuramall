import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { createReviewSchema, reviewQuerySchema } from '@aventuramall/shared';

export default async function reviewRoutes(fastify: FastifyInstance) {
  // GET /api/products/:productId/reviews - Public route to fetch reviews
  fastify.get('/api/products/:productId/reviews', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const { page, limit } = reviewQuerySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
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
      prisma.review.count({ where: { productId } }),
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

      // Verify the product exists
      const product = await prisma.product.findUnique({
        where: { id: body.productId },
      });

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Check if user already reviewed this product
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: user.id,
          productId: body.productId,
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
            productId: body.productId,
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
          where: { productId: body.productId },
          _avg: { rating: true },
          _count: { id: true },
        });

        await tx.product.update({
          where: { id: body.productId },
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
