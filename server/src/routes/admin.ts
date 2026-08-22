import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { createSession, hashPassword } from '../lib/auth.js';
import { getImpersonationCustomerPayload } from './adminImpersonation.js';
import { calculateSellerWalletBalance } from './adminSellerBalance.js';
import {
  fetchVirtualCustomerProfiles,
  mapProfilesToVirtualCustomerCreateInput,
} from './virtualCustomers.js';

import {
  adminCustomerUpdateSchema,
  normalizeAdminCustomerUpdate,
} from './adminCustomerUpdate.js';

const rechargeSchema = z.object({
  amount: z.number().positive(),
});

const createVirtualCustomersSchema = z.object({
  quantity: z.number().int().min(1).max(100),
  initialBalance: z.number().min(0).max(1000000),
  disableLogin: z.boolean(),
});

const updateSellerBalanceSchema = z.object({
  type: z.enum(['wallet', 'guarantee']).default('wallet'),
  mode: z.enum(['add', 'deduct']),
  amount: z.number().positive().max(1000000),
});

const updateSellerPasswordSchema = z.object({
  password: z.string().min(6),
});

export default async function adminRoutes(fastify: FastifyInstance) {
  // GET /api/admin/customers — List all customers
  fastify.get(
    '/api/admin/customers',
    { preHandler: [requireAdminAuth] },
    async (_request, reply) => {
      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: {
          id: true, email: true, name: true, emailVerified: true, image: true, role: true,
          createdAt: true, updatedAt: true, phone: true, walletBalance: true, package: true,
          isBanned: true, cashPayment: true, bankPayment: true, bankName: true,
          bankAccountName: true, bankAccountNumber: true, bankRoutingNumber: true,
          usdtPayment: true, usdtLink: true, usdtAddress: true,
          addresses: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ data: customers });
    }
  );

  // PATCH /api/admin/customers/:id — Update customer profile, payment settings, and addresses
  fastify.patch(
    '/api/admin/customers/:id',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { addresses, ...profileFields } = adminCustomerUpdateSchema.parse(request.body);
        const updateData = normalizeAdminCustomerUpdate(profileFields);

        const customer = await prisma.$transaction(async (tx) => {
          const existingCustomer = await tx.user.findFirst({ where: { id, role: 'CUSTOMER' } });
          if (!existingCustomer) return null;

          const updatedCustomer = await tx.user.update({ where: { id }, data: updateData });
          if (typeof updateData.email === 'string') {
            await tx.account.updateMany({
              where: { userId: id, providerId: 'email' },
              data: { accountId: updateData.email },
            });
          }

          for (const address of addresses ?? []) {
            const { id: addressId, ...addressData } = address;
            await tx.address.updateMany({
              where: { id: addressId, userId: id },
              data: { ...addressData, phone: addressData.phone?.trim() || null },
            });
          }

          return { ...updatedCustomer, addresses: await tx.address.findMany({ where: { userId: id } }) };
        });

        if (!customer) return reply.status(404).send({ error: 'Customer not found' });
        return reply.send({ data: customer });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid input', details: error.errors });
        }
        if ((error as { code?: string }).code === 'P2002') {
          return reply.status(400).send({ error: 'Email is already in use' });
        }
        return reply.status(500).send({ error: 'Failed to update customer' });
      }
    }
  );
  // PATCH /api/admin/customers/:id/recharge — Recharge customer wallet
  fastify.patch(
    '/api/admin/customers/:id/recharge',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { amount } = rechargeSchema.parse(request.body);

      const customer = await prisma.user.update({
        where: { id },
        data: {
          walletBalance: {
            increment: amount,
          },
        },
      });

      return reply.send({ data: customer });
    }
  );

  // PATCH /api/admin/customers/:id/ban — Toggle customer ban status
  fastify.patch(
    '/api/admin/customers/:id/ban',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const customer = await prisma.user.update({
        where: { id },
        data: { isBanned: !user.isBanned },
      });

      return reply.send({ data: customer });
    }
  );

  // DELETE /api/admin/customers/:id — Delete customer
  fastify.delete(
    '/api/admin/customers/:id',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.user.delete({ where: { id } });

      return reply.status(204).send();
    }
  );

  // POST /api/admin/customers/:id/impersonate — Create a real customer session for admin support
  fastify.post(
    '/api/admin/customers/:id/impersonate',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const customer = await prisma.user.findUnique({ where: { id } });
      if (!customer) return reply.status(404).send({ error: 'Customer not found' });

      let user;
      try {
        user = getImpersonationCustomerPayload(customer);
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Customer cannot be impersonated',
        });
      }

      const session = await createSession(customer.id, request.headers['user-agent'], request.ip);

      return reply.send({
        user,
        token: session.token,
      });
    }
  );

  // POST /api/admin/customers/virtual — Create generated customer accounts for admin testing
  fastify.post(
    '/api/admin/customers/virtual',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { quantity, initialBalance, disableLogin } = createVirtualCustomersSchema.parse(request.body);
      const profiles = await fetchVirtualCustomerProfiles(quantity);
      const rows = mapProfilesToVirtualCustomerCreateInput(profiles, { initialBalance, disableLogin });

      const customers = await prisma.$transaction(
        rows.map((row) =>
          prisma.user.create({
            data: {
              ...row.user,
              addresses: {
                create: row.address,
              },
            },
            include: { addresses: true },
          })
        )
      );

      return reply.status(201).send({
        data: customers,
        created: customers.length,
      });
    }
  );

  // --- Seller Management ---

  // GET /api/admin/sellers — List all sellers with product counts
  fastify.get(
    '/api/admin/sellers',
    { preHandler: [requireAdminAuth] },
    async (_request, reply) => {
      const sellers = await prisma.seller.findMany({
        include: {
          sellerPackage: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get product counts for each seller
      // Using sellerId on SellerProduct to match products
      const productsCounts = await prisma.sellerProduct.groupBy({
        by: ['sellerId'],
        _count: {
          id: true,
        },
      });

      const sellersWithCounts = sellers.map((seller) => {
        const countObj = productsCounts.find((p) => p.sellerId === seller.id);
        return {
          ...seller,
          productCount: countObj?._count.id || 0,
        };
      });

      return reply.send({ data: sellersWithCounts });
    }
  );

  // PATCH /api/admin/sellers/:id/status — Update seller status
  fastify.get(
    '/api/admin/seller-packages',
    { preHandler: [requireAdminAuth] },
    async (_request, reply) => {
      const packages = await prisma.sellerPackage.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      return reply.send({ data: packages });
    }
  );

  fastify.patch(
    '/api/admin/sellers/:id/package',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { packageId } = z.object({ packageId: z.string().min(1) }).parse(request.body);

      const sellerPackage = await prisma.sellerPackage.findUnique({ where: { id: packageId } });
      if (!sellerPackage) return reply.status(404).send({ error: 'Seller package not found' });

      const seller = await prisma.seller.update({
        where: { id },
        data: { sellerPackageId: packageId },
        include: { sellerPackage: true },
      });

      return reply.send({ data: seller });
    }
  );

  fastify.patch(
    '/api/admin/sellers/:id/status',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']) }).parse(request.body);

      const seller = await prisma.seller.update({
        where: { id },
        data: { status },
      });

      return reply.send({ data: seller });
    }
  );

  // PATCH /api/admin/sellers/:id/allow-withdraw — Toggle allow withdraw
  fastify.delete(
    '/api/admin/sellers/:id',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const seller = await prisma.seller.findUnique({ where: { id } });

      if (!seller) {
        return reply.status(404).send({ error: 'Seller not found' });
      }

      await prisma.seller.delete({ where: { id } });

      return reply.status(204).send();
    }
  );

  fastify.patch(
    '/api/admin/sellers/:id/balance',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { type, mode, amount } = updateSellerBalanceSchema.parse(request.body);

      const seller = await prisma.seller.findUnique({
        where: { id },
        select: { id: true, walletMoney: true, guaranteeMoney: true },
      });

      if (!seller) {
        return reply.status(404).send({ error: 'Seller not found' });
      }

      const currentBalance = type === 'wallet' ? Number(seller.walletMoney) : Number(seller.guaranteeMoney);

      const balanceResult = calculateSellerWalletBalance({
        currentBalance,
        amount,
        mode,
      });

      if (!balanceResult.ok) {
        return reply.status(400).send({ error: balanceResult.error });
      }

      const updateData = type === 'wallet'
        ? { walletMoney: mode === 'add' ? { increment: amount } : { decrement: amount } }
        : { guaranteeMoney: mode === 'add' ? { increment: amount } : { decrement: amount } };

      const updatedSeller = await prisma.seller.update({
        where: { id },
        data: updateData,
      });

      return reply.send({
        data: updatedSeller,
        previousBalance: type === 'wallet' ? seller.walletMoney : seller.guaranteeMoney,
        newBalance: type === 'wallet' ? updatedSeller.walletMoney : updatedSeller.guaranteeMoney,
      });
    }
  );

  fastify.patch(
    '/api/admin/sellers/:id/allow-withdraw',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      
      const seller = await prisma.seller.findUnique({ where: { id } });
      if (!seller) return reply.status(404).send({ error: 'Seller not found' });

      const updatedSeller = await prisma.seller.update({
        where: { id },
        data: { allowWithdraw: !seller.allowWithdraw },
      });

      return reply.send({ data: updatedSeller });
    }
  );

  fastify.patch(
    '/api/admin/sellers/:id/password',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { password } = updateSellerPasswordSchema.parse(request.body);

      const seller = await prisma.seller.findUnique({ where: { id } });
      if (!seller) return reply.status(404).send({ error: 'Seller not found' });

      const hashedPassword = await hashPassword(password);

      await prisma.seller.update({
        where: { id },
        data: { password: hashedPassword },
      });

      return reply.send({ success: true, message: 'Password updated successfully' });
    }
  );

  fastify.patch(
    '/api/admin/sellers/:id/settle-pending',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      
      const seller = await prisma.seller.findUnique({ where: { id } });
      if (!seller) return reply.status(404).send({ error: 'Seller not found' });

      const updatedSeller = await prisma.seller.update({
        where: { id },
        data: { pendingBalance: 0 },
      });

      return reply.send({ success: true, data: updatedSeller });
    }
  );
}
