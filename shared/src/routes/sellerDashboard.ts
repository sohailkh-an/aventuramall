import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { requireSellerAuth } from '../middleware/auth.js';
import { calculateSellerOrderAmount, summarizeSellerOrders } from './sellerOrders.js';

interface DashboardProductLike {
  stock: number;
  price: number | string | { toString(): string };
  isActive: boolean;
}

interface DashboardOrderLike {
  id: string;
  status: string;
  createdAt: Date;
  items: Array<{
    quantity: number;
    price: number | string | { toString(): string };
  }>;
}

interface DashboardSummaryInput {
  now?: Date;
  packageLimit: number;
  profitPercent: number;
  products: DashboardProductLike[];
  orders: DashboardOrderLike[];
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function addUtcMonths(value: Date, months: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1));
}

function isWithin(value: Date, start: Date, end: Date) {
  return value >= start && value < end;
}

function dayKey(value: Date) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

function dayLabel(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(value);
}

export function summarizeSellerDashboard({
  now = new Date(),
  packageLimit,
  profitPercent,
  products,
  orders,
}: DashboardSummaryInput) {
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addUtcDays(todayStart, 1);
  const yesterdayStart = addUtcDays(todayStart, -1);
  const monthStart = startOfUtcMonth(now);
  const nextMonthStart = addUtcMonths(monthStart, 1);
  const lastMonthStart = addUtcMonths(monthStart, -1);

  const productTotal = products.length;
  const orderAmount = (order: DashboardOrderLike) => calculateSellerOrderAmount(order.items);
  const sumOrders = (filteredOrders: DashboardOrderLike[]) =>
    money(filteredOrders.reduce((sum, order) => sum + orderAmount(order), 0));

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(todayStart, index - 6);
    const key = dayKey(date);
    const dayOrders = orders.filter((order) => dayKey(order.createdAt) === key);

    return {
      date: key,
      label: dayLabel(date),
      sales: sumOrders(dayOrders),
      orders: dayOrders.length,
    };
  });

  return {
    products: {
      total: productTotal,
      active: products.filter((product) => product.isActive).length,
      hidden: products.filter((product) => !product.isActive).length,
      inventoryValue: money(
        products.reduce((sum, product) => sum + Number(product.price.toString()) * product.stock, 0)
      ),
      packageLimit,
      remainingSlots: Math.max(packageLimit - productTotal, 0),
      usagePercent: packageLimit > 0 ? Math.min(Math.round((productTotal / packageLimit) * 100), 100) : 0,
    },
    orders: summarizeSellerOrders(orders),
    sales: {
      today: sumOrders(orders.filter((order) => isWithin(order.createdAt, todayStart, tomorrowStart))),
      yesterday: sumOrders(orders.filter((order) => isWithin(order.createdAt, yesterdayStart, todayStart))),
      thisMonth: sumOrders(orders.filter((order) => isWithin(order.createdAt, monthStart, nextMonthStart))),
      lastMonth: sumOrders(orders.filter((order) => isWithin(order.createdAt, lastMonthStart, monthStart))),
      profitPercent,
      estimatedProfit: money(sumOrders(orders) * (profitPercent / 100)),
    },
    chart,
  };
}

export default async function sellerDashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/seller/dashboard/summary',
    { preHandler: [requireSellerAuth] },
    async (request, reply) => {
      const sellerPayload = (request as any).seller;

      const [seller, products, orders] = await Promise.all([
        prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            walletMoney: true,
            pendingBalance: true,
            guaranteeMoney: true,
            allowWithdraw: true,
            sellerPackage: true,
          },
        }),
        prisma.sellerProduct.findMany({
          where: { sellerId: sellerPayload.userId },
          select: {
            stock: true,
            price: true,
            isActive: true,
          },
        }),
        prisma.order.findMany({
          where: {
            items: {
              some: {
                sellerProduct: {
                  sellerId: sellerPayload.userId,
                },
              },
            },
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            items: {
              where: {
                sellerProduct: {
                  sellerId: sellerPayload.userId,
                },
              },
              select: {
                quantity: true,
                price: true,
              },
            },
          },
        }),
      ]);

      if (!seller) {
        return reply.status(404).send({ error: 'Seller not found' });
      }

      return reply.send({
        data: {
          ...summarizeSellerDashboard({
            packageLimit: seller.sellerPackage?.productLimit ?? 300,
            profitPercent: Number(seller.sellerPackage?.profitPercent ?? 15),
            products,
            orders,
          }),
          balances: {
            walletMoney: Number(seller.walletMoney),
            pendingBalance: Number(seller.pendingBalance),
            guaranteeMoney: Number(seller.guaranteeMoney),
            allowWithdraw: seller.allowWithdraw,
          },
        },
      });
    }
  );
}
