import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { uploadImage } from '../lib/cloudinary.js';

const paymentNetworkSchema = z.enum(['TRC20', 'ETH', 'BTC', 'BSC', 'SOL']);

const createPaymentMethodSchema = z.object({
  network: paymentNetworkSchema,
  logoBase64: z.string().min(1),
  address: z.string().min(4).max(255).trim(),
  isEnabled: z.boolean().default(true),
});

const updatePaymentMethodSchema = z.object({
  network: paymentNetworkSchema,
  logoBase64: z.string().optional(),
  logo: z.string().url().optional(),
  address: z.string().min(4).max(255).trim(),
  isEnabled: z.boolean(),
});

const byIdSchema = z.object({
  id: z.string().min(1),
});

function isValidAddressForNetwork(network: z.infer<typeof paymentNetworkSchema>, address: string) {
  const trimmed = address.trim();

  switch (network) {
    case 'BTC':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
    case 'ETH':
    case 'BSC':
      return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
    case 'TRC20':
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed);
    case 'SOL':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    default:
      return false;
  }
}

export default async function adminPaymentMethodsRoutes(fastify: FastifyInstance) {
  const paymentMethodModel = (prisma as any).paymentMethod;

  fastify.get('/api/admin/payment-methods', { preHandler: [requireAdminAuth] }, async (_request, reply) => {
    const methods = await paymentMethodModel.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });

    return reply.send({ data: methods });
  });

  fastify.post(
    '/api/admin/payment-methods',
    { preHandler: [requireAdminAuth], bodyLimit: 10485760 },
    async (request, reply) => {
      const body = createPaymentMethodSchema.parse(request.body);

      if (!body.logoBase64.startsWith('data:image')) {
        return reply.status(400).send({ error: 'Logo must be an image file' });
      }

      if (!isValidAddressForNetwork(body.network, body.address)) {
        return reply.status(400).send({ error: `Invalid wallet address for ${body.network}` });
      }

      const logo = await uploadImage(body.logoBase64, 'payment-networks');

      const created = await paymentMethodModel.create({
        data: {
          network: body.network,
          logo,
          address: body.address,
          isEnabled: body.isEnabled,
        },
      });

      return reply.status(201).send({ data: created });
    }
  );

  fastify.put(
    '/api/admin/payment-methods/:id',
    { preHandler: [requireAdminAuth], bodyLimit: 10485760 },
    async (request, reply) => {
      const { id } = byIdSchema.parse(request.params);
      const body = updatePaymentMethodSchema.parse(request.body);

      if (!isValidAddressForNetwork(body.network, body.address)) {
        return reply.status(400).send({ error: `Invalid wallet address for ${body.network}` });
      }

      let logo = body.logo;
      if (body.logoBase64) {
        if (!body.logoBase64.startsWith('data:image')) {
          return reply.status(400).send({ error: 'Logo must be an image file' });
        }
        logo = await uploadImage(body.logoBase64, 'payment-networks');
      }

      if (!logo) {
        return reply.status(400).send({ error: 'Logo is required' });
      }

      const updated = await paymentMethodModel.update({
        where: { id },
        data: {
          network: body.network,
          logo,
          address: body.address,
          isEnabled: body.isEnabled,
        },
      });

      return reply.send({ data: updated });
    }
  );

  fastify.delete('/api/admin/payment-methods/:id', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    try {
      const { id } = byIdSchema.parse(request.params);
      await paymentMethodModel.delete({ where: { id } });
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Delete payment method error:', error);
      return reply.status(500).send({ error: 'Failed to delete payment method' });
    }
  });

  fastify.get('/api/seller/payment-methods', async (_request, reply) => {
    const methods = await paymentMethodModel.findMany({
      where: { isEnabled: true },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        network: true,
        logo: true,
        address: true,
      },
    });

    return reply.send({ data: methods });
  });
}
