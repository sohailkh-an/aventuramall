import type { FastifyInstance } from 'fastify';
// import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema
} from '@aventuramall/shared';

// ─── Routes ─────────────────────────────────────────────────────────────────

export default async function productRoutes(fastify: FastifyInstance) {
  // GET /api/products — List products (public)
  fastify.get('/api/products', async (request, reply) => {
    const query = productQuerySchema.parse(request.query);
    const { page, limit, category, search, active } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = { slug: category };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (active !== undefined) where.isActive = active;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return reply.send({
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // GET /api/products/:slug — Get single product (public)
  fastify.get('/api/products/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    return reply.send({ data: product });
  });


  

  // POST /api/products — Create product (admin only)
  fastify.post(
    '/api/products',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const body = createProductSchema.parse(request.body);
      const slug =
        body.slug ||
        body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      const product = await prisma.product.create({
        data: {
          ...body,
          slug,
        },
        include: { category: true },
      });

      return reply.status(201).send({ data: product });
    }
  );

  // PATCH /api/products/:id — Update product (admin only)
  fastify.patch(
    '/api/products/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateProductSchema.parse(request.body);

      const product = await prisma.product.update({
        where: { id },
        data: body,
        include: { category: true },
      });

      return reply.send({ data: product });
    }
  );

  // DELETE /api/products/:id — Delete product (admin only)
  fastify.delete(
    '/api/products/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.product.delete({ where: { id } });

      return reply.status(204).send();
    }
  );
  // GET /api/categories — List all categories
  fastify.get('/api/categories', async (_request, reply) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return reply.send({ data: categories });
  });
}
