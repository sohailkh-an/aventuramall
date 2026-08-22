import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { generateToken } from '../lib/auth.js';
import { requireAdminAuth } from '../middleware/auth.js';

interface SellerForImpersonation {
  id: string;
  email: string;
  name: string;
  shopName: string;
  status: string;
  sellerPackageId: string | null;
}

export function getImpersonationSellerPayload(seller: SellerForImpersonation) {
  return {
    tokenPayload: {
      userId: seller.id,
      email: seller.email,
      role: 'SELLER',
    },
    seller: {
      id: seller.id,
      email: seller.email,
      name: seller.name,
      shopName: seller.shopName,
      status: seller.status,
      sellerPackageId: seller.sellerPackageId,
    },
  };
}

export default async function adminSellerImpersonationRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/admin/sellers/:id/impersonate',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const seller = await prisma.seller.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          shopName: true,
          status: true,
          sellerPackageId: true,
        },
      });

      if (!seller) {
        return reply.status(404).send({ error: 'Seller not found' });
      }

      const payload = getImpersonationSellerPayload(seller);
      const token = generateToken(payload.tokenPayload);

      return reply.send({
        success: true,
        token,
        seller: payload.seller,
      });
    }
  );
}
