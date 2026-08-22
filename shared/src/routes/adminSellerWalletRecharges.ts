import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAdminAuth } from '../middleware/auth.js';

const byIdSchema = z.object({
  id: z.string().min(1),
});

const approvalSchema = z.object({
  approvedAmount: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  adminMessage: z.string().trim().max(500).optional(),
}).superRefine((data, context) => {
  if (!Number.isFinite(data.approvedAmount) || data.approvedAmount <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['approvedAmount'],
      message: 'approvedAmount must be greater than 0',
    });
  }
});

const rejectionSchema = z.object({
  adminMessage: z.string().trim().max(500).optional(),
});

export function normalizeRechargeApproval(input: unknown) {
  const data = approvalSchema.parse(input);

  return {
    approvedAmount: data.approvedAmount,
    adminMessage: data.adminMessage || null,
  };
}

export function normalizeRechargeRejection(input: unknown) {
  const data = rejectionSchema.parse(input);

  return {
    adminMessage: data.adminMessage || null,
  };
}

export function assertRechargeCanBeResolved(recharge: { status: string }) {
  if (recharge.status !== 'PENDING') {
    throw new Error('Recharge request is already resolved');
  }
}

export function assertRechargeCanBeDeleted(_recharge: { status: string }) {
  // All recharge requests (PENDING, APPROVED, REJECTED) can be deleted by admin
}

const rechargeInclude = {
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      shopName: true,
      walletMoney: true,
    },
  },
  paymentMethod: {
    select: {
      id: true,
      network: true,
      logo: true,
      address: true,
    },
  },
};

export default async function adminSellerWalletRechargesRoutes(fastify: FastifyInstance) {
  const sellerWalletRechargeModel = (prisma as any).sellerWalletRecharge;

  fastify.get('/api/admin/seller-wallet-recharges', { preHandler: [requireAdminAuth] }, async (_request, reply) => {
    const recharges = await sellerWalletRechargeModel.findMany({
      include: rechargeInclude,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ data: recharges });
  });

  fastify.post('/api/admin/seller-wallet-recharges/:id/approve', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    try {
      const { id } = byIdSchema.parse(request.params);
      const { approvedAmount, adminMessage } = normalizeRechargeApproval(request.body);

      const updated = await prisma.$transaction(async (tx) => {
        const recharge = await (tx as any).sellerWalletRecharge.findUnique({
          where: { id },
          select: {
            id: true,
            sellerId: true,
            status: true,
          },
        });

        if (!recharge) {
          return null;
        }

        assertRechargeCanBeResolved(recharge);

        await tx.seller.update({
          where: { id: recharge.sellerId },
          data: {
            walletMoney: {
              increment: approvedAmount,
            },
          },
        });

        return (tx as any).sellerWalletRecharge.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedAmount,
            adminMessage,
            resolvedAt: new Date(),
          },
          include: rechargeInclude,
        });
      });

      if (!updated) {
        return reply.status(404).send({ error: 'Recharge request not found' });
      }

      return reply.send({ data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('already resolved')) {
        return reply.status(409).send({ error: error.message });
      }
      console.error('Approve seller wallet recharge error:', error);
      return reply.status(500).send({ error: 'Failed to approve recharge request' });
    }
  });

  fastify.post('/api/admin/seller-wallet-recharges/:id/reject', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    try {
      const { id } = byIdSchema.parse(request.params);
      const { adminMessage } = normalizeRechargeRejection(request.body);

      const recharge = await sellerWalletRechargeModel.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!recharge) {
        return reply.status(404).send({ error: 'Recharge request not found' });
      }

      assertRechargeCanBeResolved(recharge);

      const updated = await sellerWalletRechargeModel.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminMessage,
          resolvedAt: new Date(),
        },
        include: rechargeInclude,
      });

      return reply.send({ data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('already resolved')) {
        return reply.status(409).send({ error: error.message });
      }
      console.error('Reject seller wallet recharge error:', error);
      return reply.status(500).send({ error: 'Failed to reject recharge request' });
    }
  });

  fastify.delete('/api/admin/seller-wallet-recharges/:id', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    try {
      const { id } = byIdSchema.parse(request.params);
      const recharge = await sellerWalletRechargeModel.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!recharge) {
        return reply.status(404).send({ error: 'Recharge request not found' });
      }

      assertRechargeCanBeDeleted(recharge);
      await sellerWalletRechargeModel.delete({ where: { id } });

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('cannot be deleted')) {
        return reply.status(409).send({ error: error.message });
      }
      console.error('Delete seller wallet recharge error:', error);
      return reply.status(500).send({ error: 'Failed to delete recharge request' });
    }
  });
}
