import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const createSession = async (userId: string, userAgent?: string, ipAddress?: string) => {
  // Fetch the actual user to populate the JWT with correct data
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const token = generateToken({
    userId,
    email: user.email,
    role: user.role,
  });

  // Store session in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  return session;
};

// Simple in-memory cache for validated sessions to reduce DB load
// Cache results for 30 seconds
const sessionCache = new Map<string, { result: any, expires: number }>();

export const validateSession = async (token: string) => {
  const now = Date.now();
  const cached = sessionCache.get(token);
  if (cached && cached.expires > now) {
    return cached.result;
  }

  const payload = verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    sessionCache.delete(token);
    return null;
  }

  const result = { session, user: session.user };
  sessionCache.set(token, { result, expires: now + 30000 });
  
  return result;
};

export const deleteSession = async (token: string) => {
  sessionCache.delete(token);
  return prisma.session.delete({ where: { token } });
};
