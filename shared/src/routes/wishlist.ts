import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

const addWishlistSchema = z.object({
  productId: z.string(),
});

export default async function wishlistRoutes(fastify: FastifyInstance) {
  // GET /api/wishlist
  fastify.get(
    '/api/wishlist',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;

      const wishlistItems = await prisma.wishlistItem.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ data: wishlistItems });
    }
  );

  // POST /api/wishlist
  fastify.post(
    '/api/wishlist',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { productId } = addWishlistSchema.parse(request.body);

      // Check if product exists
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return reply.status(404).send({ error: 'Product not found' });

      // Upsert to avoid unique constraint errors
      const item = await prisma.wishlistItem.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        update: {},
        create: {
          userId,
          productId,
        },
        include: { product: true },
      });

      return reply.status(201).send({ data: item });
    }
  );

  // DELETE /api/wishlist/:productId
  fastify.delete(
    '/api/wishlist/:productId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { productId } = request.params as { productId: string };

      await prisma.wishlistItem.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      return reply.status(204).send();
    }
  );
}
