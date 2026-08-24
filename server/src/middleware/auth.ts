import { verifyToken, validateSession } from '../lib/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db/client.js';

/**
 * Authentication middleware that validates the JWT token.
 * Attach to routes that require authenticated access.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractToken(request);
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized - No token provided' });
    }

    const result = await validateSession(token);
    if (!result) {
      return reply.status(401).send({ error: 'Unauthorized - Invalid or expired token' });
    }

    // Attach user data to the request for downstream use
    (request as any).user = result.user;
    (request as any).session = result.session;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Admin-only middleware. Must be used after requireAuth.
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;

  if (!user || user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden: Admin access required' });
  }
}

function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Authentication middleware for sellers.
 */
export async function requireSellerAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractToken(request);
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized - No token provided' });
    }

    // Since we are using stateless JWT for seller (no DB session), we verify it directly
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'SELLER') {
      return reply.status(401).send({ error: 'Unauthorized - Invalid or expired token' });
    }

    // Verify the seller is not banned/suspended
    const seller = await prisma.seller.findUnique({
      where: { id: payload.userId }
    });

    if (!seller || seller.status === 'SUSPENDED') {
      return reply.status(401).send({ error: 'Unauthorized - Account suspended or not found' });
    }

    // Attach seller data to the request
    (request as any).seller = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Admin-only middleware using JWT cookie.
 */
export async function requireAdminAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.cookies.admin_token;
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized - No admin token provided' });
    }

    const payload = verifyToken(token);

    if (!payload || payload.role !== 'ADMIN') {
      return reply.status(401).send({ error: 'Unauthorized - Invalid or expired admin token' });
    }

    // Attach admin data to the request
    (request as any).user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}
