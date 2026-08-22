import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { comparePassword, generateToken } from '../lib/auth.js';
import {
  ADMIN_COOKIE_NAME,
  getAdminClearCookieOptions,
  getAdminCookieOptions,
} from '../lib/adminCookie.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function adminAuthRoutes(fastify: FastifyInstance) {
  // POST /api/admin/auth/login
  fastify.post('/api/admin/auth/login', async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'ADMIN') {
      return reply.status(401).send({ error: 'Invalid credentials or not an admin' });
    }

    if (!user.password) {
      return reply.status(401).send({ error: 'Admin account not properly configured' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set cookie
    reply.setCookie(ADMIN_COOKIE_NAME, token, getAdminCookieOptions());

    return reply.send({ 
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Login successful' 
    });
  });

  // POST /api/admin/auth/logout
  fastify.post('/api/admin/auth/logout', async (_request, reply) => {
    reply.clearCookie(ADMIN_COOKIE_NAME, getAdminClearCookieOptions());
    return reply.send({ message: 'Logged out successfully' });
  });

  // GET /api/admin/auth/me
  fastify.get('/api/admin/auth/me', async (request, reply) => {
    const token = request.cookies[ADMIN_COOKIE_NAME];
    if (!token) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const { verifyToken } = await import('../lib/auth.js');
    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'ADMIN') {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ data: user });
  });
}
