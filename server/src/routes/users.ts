import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(255).optional(),
  image: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  cashPayment: z.boolean().optional(),
  bankPayment: z.boolean().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
  usdtPayment: z.boolean().optional(),
  usdtLink: z.string().optional(),
  usdtAddress: z.string().optional(),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

const nullableProfileStringFields = [
  'image',
  'phone',
  'bankName',
  'bankAccountName',
  'bankAccountNumber',
  'bankRoutingNumber',
  'usdtLink',
  'usdtAddress',
] as const;

const profileBooleanFields = [
  'cashPayment',
  'bankPayment',
  'usdtPayment',
] as const;

function normalizeNullableString(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeUserProfileUpdate(body: Omit<UpdateProfileInput, 'password'>) {
  const updateData: Record<string, string | boolean | null> = {};

  if (body.email !== undefined) {
    updateData.email = body.email.trim().toLowerCase();
  }

  if (body.name !== undefined) {
    updateData.name = body.name.trim();
  }

  for (const field of nullableProfileStringFields) {
    const value = normalizeNullableString(body[field]);
    if (value !== undefined) {
      updateData[field] = value;
    }
  }

  for (const field of profileBooleanFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  return updateData;
}

function isUniqueConstraintError(error: unknown, field: string) {
  const maybeError = error as { code?: string; meta?: { target?: unknown } };
  if (maybeError.code !== 'P2002') return false;

  const target = maybeError.meta?.target;
  return Array.isArray(target) ? target.includes(field) : target === field;
}

const addressSchema = z.object({
  label: z.string().min(1).max(100).default('Home'),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1).optional(),
  isDefault: z.boolean().default(false),
});

const transactionPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6),
});

const verifyTransactionPasswordSchema = z.object({
  password: z.string().min(1),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users/me — Get current user profile (authenticated)
  fastify.get(
    '/api/users/me',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { addresses: true },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const hasTransactionPassword = !!user.transactionPassword;
      
      // Remove sensitive data
      const safeUser = { ...user } as any;
      delete safeUser.password;
      delete safeUser.transactionPassword;

      return reply.send({ data: { ...safeUser, hasTransactionPassword } });
    }
  );

  // PATCH /api/users/me — Update current user profile (authenticated)
  fastify.patch(
    '/api/users/me',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const userId = (request as any).user.id;
        const body = updateProfileSchema.parse(request.body);

        // Separate password from other fields
        const { password, ...profileFields } = body;
        const updateData = normalizeUserProfileUpdate(profileFields);

        const user = await prisma.$transaction(async (tx) => {
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: updateData,
          });

          if (typeof updateData.email === 'string') {
            await tx.account.updateMany({
              where: { userId, providerId: 'email' },
              data: { accountId: updateData.email },
            });
          }

          return updatedUser;
        });

        // If password is provided, hash it and update the associated email account
        if (password) {
          const { hashPassword } = await import('../lib/auth.js');
          const hashedPassword = await hashPassword(password);
          
          const account = await prisma.account.findFirst({
            where: { userId, providerId: 'email' },
          });

          if (account) {
            await prisma.account.update({
              where: { id: account.id },
              data: { password: hashedPassword },
            });
          }
        }

        const safeUser = { ...user } as any;
        delete safeUser.password;
        delete safeUser.transactionPassword;

        return reply.send({ data: safeUser });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid input', details: error.errors });
        }

        if (isUniqueConstraintError(error, 'email')) {
          return reply.status(400).send({ error: 'Email is already in use' });
        }

        return reply.status(500).send({ error: 'Failed to update profile' });
      }
    }
  );

  // GET /api/users/me/addresses — List user addresses
  fastify.get(
    '/api/users/me/addresses',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;

      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
      });

      return reply.send({ data: addresses });
    }
  );

  // POST /api/users/me/addresses — Add address
  fastify.post(
    '/api/users/me/addresses',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const body = addressSchema.parse(request.body);

      // If this is set as default, unset other defaults
      if (body.isDefault) {
        await prisma.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: { ...body, userId },
      });

      return reply.status(201).send({ data: address });
    }
  );

  // DELETE /api/users/me/addresses/:id — Delete address
  fastify.delete(
    '/api/users/me/addresses/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.id;

      const address = await prisma.address.findFirst({
        where: { id, userId },
      });

      if (!address) {
        return reply.status(404).send({ error: 'Address not found' });
      }

      await prisma.address.delete({ where: { id } });

      return reply.status(204).send();
    }
  );

  // PUT /api/users/me/transaction-password
  fastify.put(
    '/api/users/me/transaction-password',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const body = transactionPasswordSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      if (user.transactionPassword && user.transactionPassword !== body.currentPassword) {
        return reply.status(400).send({ error: 'Invalid current transaction password' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { transactionPassword: body.newPassword },
      });

      return reply.send({ success: true, message: 'Transaction password updated successfully' });
    }
  );

  // POST /api/users/me/transaction-password/verify
  fastify.post(
    '/api/users/me/transaction-password/verify',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const body = verifyTransactionPasswordSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      if (!user.transactionPassword) {
        return reply.status(400).send({ error: 'Transaction password not set' });
      }

      if (user.transactionPassword !== body.password) {
        return reply.status(400).send({ error: 'Invalid transaction password' });
      }

      return reply.send({ success: true, message: 'Password verified' });
    }
  );

  // GET /api/users — List all users (admin only)
  fastify.get(
    '/api/users',
    { preHandler: [requireAuth, requireAdmin] },
    async (_request, reply) => {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({ data: users });
    }
  );
}
