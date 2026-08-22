import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { updateOrderStatusWithFinancials } from '../lib/orderStatus.js';


// ─── Zod Schemas ────────────────────────────────────────────────────────────

const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z
    .enum(['PENDING', 'PROCESSING', 'CONFIRMED', 'PICKED_UP', 'SHIPPED', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'])
    .optional(),
});

const createOrderSchema = z.object({
  shippingAddressId: z.string().cuid(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  paymentMethod: z.string().optional(),
  deliveryType: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'CONFIRMED', 'PICKED_UP', 'SHIPPED', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

export default async function orderRoutes(fastify: FastifyInstance) {
  // GET /api/orders — List user's orders (authenticated)
  fastify.get(
    '/api/orders',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const query = orderQuerySchema.parse(request.query);
      const userId = (request as any).user.id;
      const { page, limit, status } = query;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { userId };
      if (status) where.status = status;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          include: {
            items: { include: { product: true } },
            shippingAddress: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      return reply.send({
        data: orders,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  // GET /api/orders/:id — Get single order (authenticated, own order or admin)
  fastify.get(
    '/api/orders/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          shippingAddress: true,
        },
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      if (order.userId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      return reply.send({ data: order });
    }
  );

  // POST /api/orders — Create order (authenticated)
  fastify.post(
    '/api/orders',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const body = createOrderSchema.parse(request.body);
      const userId = (request as any).user.id;

      // Fetch product prices for order total calculation
      const products = await prisma.product.findMany({
        where: { id: { in: body.items.map((i) => i.productId) } },
      });

      const productMap = new Map(products.map((p: any) => [p.id, p]));
      let total = 0;

      const orderItems = body.items.map((item) => {
        const product = productMap.get(item.productId) as any;
        if (!product) throw new Error(`Product ${item.productId} not found`);
        const price = Number(product.price);
        total += price * item.quantity;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price,
        };
      });

      const order = await prisma.order.create({
        data: {
          userId,
          shippingAddressId: body.shippingAddressId,
          total,
          paymentMethod: body.paymentMethod,
          deliveryType: body.deliveryType,
          items: { create: orderItems },
        },
        include: {
          items: { include: { product: true } },
          shippingAddress: true,
          user: true,
        },
      });

      return reply.status(201).send({ data: order });
    }
  );

  // PATCH /api/orders/:id/status — Update order status (admin only)
  fastify.patch(
    '/api/orders/:id/status',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateOrderStatusSchema.parse(request.body);

      const order = await updateOrderStatusWithFinancials(id, body.status);

      return reply.send({ data: order });
    }
  );
}
