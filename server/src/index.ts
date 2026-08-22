import 'dotenv/config';
import Fastify from 'fastify';
import corsPlugin from './plugins/cors.js';
import helmetPlugin from './plugins/helmet.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import cookie from '@fastify/cookie';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import publicStoreRoutes from './routes/publicStores.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import sellerRoutes from './routes/seller.js';
import sellerOrdersRoutes from './routes/sellerOrders.js';
import sellerDashboardRoutes from './routes/sellerDashboard.js';
import sellerSpreadPackagesRoutes from './routes/sellerSpreadPackages.js';
import sellerPackagesRoutes from './routes/sellerPackages.js';
import adminRoutes from './routes/admin.js';
import adminPosRoutes from './routes/adminPos.js';
import adminSalesRoutes from './routes/adminSales.js';
import adminSellerImpersonationRoutes from './routes/adminSellerImpersonation.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminPaymentMethodsRoutes from './routes/adminPaymentMethods.js';
import adminSellerWalletRechargesRoutes from './routes/adminSellerWalletRecharges.js';
import adminSellerWalletWithdrawalsRoutes from './routes/adminSellerWalletWithdrawals.js';
import wishlistRoutes from './routes/wishlist.js';
import compareRoutes from './routes/compare.js';
import cartRoutes from './routes/cart.js';

const fastify = Fastify({
  bodyLimit: 52428800, // 50MB
  routerOptions: {
    maxParamLength: 300,
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

await fastify.register(corsPlugin);
await fastify.register(helmetPlugin);
await fastify.register(rateLimitPlugin);
await fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'fallback-cookie-secret',
});

await fastify.register(authRoutes);
await fastify.register(productRoutes);
await fastify.register(publicStoreRoutes);
await fastify.register(orderRoutes);
await fastify.register(userRoutes);
await fastify.register(sellerRoutes);
await fastify.register(sellerOrdersRoutes);
await fastify.register(sellerDashboardRoutes);
await fastify.register(sellerSpreadPackagesRoutes);
await fastify.register(sellerPackagesRoutes);
await fastify.register(adminRoutes);
await fastify.register(adminPosRoutes);
await fastify.register(adminSalesRoutes);
await fastify.register(adminSellerImpersonationRoutes);
await fastify.register(adminAuthRoutes);
await fastify.register(adminPaymentMethodsRoutes);
await fastify.register(adminSellerWalletRechargesRoutes);
await fastify.register(adminSellerWalletWithdrawalsRoutes);
await fastify.register(wishlistRoutes);
await fastify.register(compareRoutes);
await fastify.register(cartRoutes);

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

export default async (req: any, res: any) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 4000;
  const HOST = process.env.HOST || '127.0.0.1';

  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
