import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

const addCompareSchema = z.object({
  productId: z.string(),
});

export default async function compareRoutes(fastify: FastifyInstance) {
  // GET /api/compare
  fastify.get(
    '/api/compare',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;

      const compareItems = await prisma.compareItem.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ data: compareItems });
    }
  );

  // POST /api/compare
  fastify.post(
    '/api/compare',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { productId } = addCompareSchema.parse(request.body);

      // Check if product exists
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return reply.status(404).send({ error: 'Product not found' });

      // Upsert to avoid unique constraint errors
      const item = await prisma.compareItem.upsert({
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

  // DELETE /api/compare/:productId
  fastify.delete(
    '/api/compare/:productId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { productId } = request.params as { productId: string };

      await prisma.compareItem.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      return reply.status(204).send();
    }
  );
}
