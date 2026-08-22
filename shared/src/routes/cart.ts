import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

const addCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).optional(),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(0),
});

export default async function cartRoutes(fastify: FastifyInstance) {
  fastify.get('/api/cart', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { updatedAt: 'desc' },
    });

    return reply.send({ data: cartItems });
  });

  fastify.post('/api/cart', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user.id;
    const { productId, quantity = 1 } = addCartSchema.parse(request.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });

    return reply.status(201).send({ data: item });
  });

  fastify.patch('/api/cart/:productId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user.id;
    const { productId } = request.params as { productId: string };
    const { quantity } = updateCartSchema.parse(request.body);

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId,
          productId,
        },
      });
      return reply.status(204).send();
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {
        quantity,
      },
      create: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });

    return reply.send({ data: item });
  });

  fastify.delete('/api/cart/:productId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user.id;
    const { productId } = request.params as { productId: string };

    await prisma.cartItem.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return reply.status(204).send();
  });

  fastify.delete('/api/cart', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user.id;

    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    return reply.status(204).send();
  });
}
