import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAdminAuth } from '../middleware/auth.js';

const byIdSchema = z.object({
  id: z.string().min(1),
});

const resolveWithdrawalSchema = z.object({
  adminMessage: z.string().trim().max(500).optional(),
});

const withdrawalInclude = {
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      shopName: true,
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

export default async function adminSellerWalletWithdrawalsRoutes(fastify: FastifyInstance) {
  const sellerWalletWithdrawalModel = (prisma as any).sellerWalletWithdrawal;

  fastify.get('/api/admin/seller-wallet-withdrawals', { preHandler: [requireAdminAuth] }, async (_request, reply) => {
    try {
      const withdrawals = await sellerWalletWithdrawalModel.findMany({
        include: withdrawalInclude,
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ data: withdrawals });
    } catch (error) {
      console.error('Fetch seller wallet withdrawals error:', error);
      return reply.status(500).send({ error: 'Failed to fetch seller wallet withdrawals' });
    }
  });

  fastify.post('/api/admin/seller-wallet-withdrawals/:id/approve', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    try {
      const { id } = byIdSchema.parse(request.params);
      const body = resolveWithdrawalSchema.parse(request.body || {});
      const adminMessage = body.adminMessage?.trim() || null;

      const updated = await prisma.$transaction(async (tx) => {
        const withdrawal = await (tx as any).sellerWalletWithdrawal.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
          },
        });

        if (!withdrawal) {
          return null;
        }

        if (withdrawal.status !== 'PENDING') {
          throw new Error('Withdrawal request is already resolved');
        }

        return (tx as any).sellerWalletWithdrawal.update({
          where: { id },
          data: {
            status: 'APPROVED',
            adminMessage,
            resolvedAt: new Date(),
          },
          include: withdrawalInclude,
        });
      });

      if (!updated) {
        return reply.status(404).send({ error: 'Withdrawal request not found' });
      }

      return reply.send({ data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('already resolved')) {
        return reply.status(409).send({ error: error.message });
      }
      console.error('Approve seller wallet withdrawal error:', error);
      return reply.status(500).send({ error: 'Failed to approve withdrawal request' });
    }
  });

  fastify.post('/api/admin/seller-wallet-withdrawals/:id/reject', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    try {
      const { id } = byIdSchema.parse(request.params);
      const body = resolveWithdrawalSchema.parse(request.body || {});
      const adminMessage = body.adminMessage?.trim() || null;

      const updated = await prisma.$transaction(async (tx) => {
        const withdrawal = await (tx as any).sellerWalletWithdrawal.findUnique({
          where: { id },
          select: {
            id: true,
            sellerId: true,
            amount: true,
            status: true,
          },
        });

        if (!withdrawal) {
          return null;
        }

        if (withdrawal.status !== 'PENDING') {
          throw new Error('Withdrawal request is already resolved');
        }

        // Refund wallet balance back to seller
        await tx.seller.update({
          where: { id: withdrawal.sellerId },
          data: {
            walletMoney: {
              increment: withdrawal.amount,
            },
          },
        });

        return (tx as any).sellerWalletWithdrawal.update({
          where: { id },
          data: {
            status: 'REJECTED',
            adminMessage,
            resolvedAt: new Date(),
          },
          include: withdrawalInclude,
        });
      });

      if (!updated) {
        return reply.status(404).send({ error: 'Withdrawal request not found' });
      }

      return reply.send({ data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('already resolved')) {
        return reply.status(409).send({ error: error.message });
      }
      console.error('Reject seller wallet withdrawal error:', error);
      return reply.status(500).send({ error: 'Failed to reject withdrawal request' });
    }
  });
}
