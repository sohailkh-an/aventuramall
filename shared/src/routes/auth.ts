import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { 
  hashPassword, 
  comparePassword, 
  createSession, 
  validateSession, 
  deleteSession 
} from '../lib/auth.js';
import { prisma } from '../db/client.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, name } = registerSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(400).send({ error: 'User already exists' });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          emailVerified: false,
          role: 'CUSTOMER',
        },
      });

      // Create account with password
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: email,
          providerId: 'email',
          password: hashedPassword,
        },
      });

      // Create session
      const userAgent = request.headers['user-agent'];
      const ipAddress = request.ip;
      const session = await createSession(user.id, userAgent, ipAddress);

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token: session.token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // Find user with account
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          accounts: {
            where: { providerId: 'email' },
          },
        },
      });

      if (!user || !user.accounts.length) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      if (user.isBanned) {
        return reply.status(403).send({ error: 'Your account has been disabled' });
      }

      const account = user.accounts[0];
      if (!account.password) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await comparePassword(password, account.password);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Create session
      const userAgent = request.headers['user-agent'];
      const ipAddress = request.ip;
      const session = await createSession(user.id, userAgent, ipAddress);

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token: session.token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get session
  fastify.get('/api/auth/session', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = extractToken(request);
      if (!token) {
        return reply.status(401).send({ error: 'No token provided' });
      }

      const result = await validateSession(token);
      if (!result) {
        return reply.status(401).send({ error: 'Invalid or expired token' });
      }

      return reply.send({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Logout
  fastify.post('/api/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = extractToken(request);
      if (!token) {
        return reply.status(401).send({ error: 'No token provided' });
      }

      await deleteSession(token);
      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
