import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { updateOrderStatusWithFinancials } from '../lib/orderStatus.js';
import { getOrderDeletionReversal } from '../lib/orderFinancials.js';

interface AdminSalesOrderItemLike {
  product: {
    name?: string;
    images?: string[];
    soldBy?: string | null;
  };
  sellerProduct?: {
    name?: string;
    images?: string[];
    seller: {
      email: string;
      shopName: string;
    };
  } | null;
}

type AdminDeliveryStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

type LegacyOrderStatus = AdminDeliveryStatus | 'PROCESSING' | 'SHIPPED';

const salesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum([
      'ALL',
      'PENDING',
      'PROCESSING',
      'CONFIRMED',
      'PICKED_UP',
      'SHIPPED',
      'ON_THE_WAY',
      'DELIVERED',
      'CANCELLED',
    ])
    .default('ALL'),
  date: z.string().trim().optional().default(''),
  q: z.string().trim().optional().default(''),
  seller: z.string().trim().optional().default(''),
});

export const adminPaymentStatusSchema = z.enum(['PAID', 'UNPAID']);

export const adminDeliveryStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
]);

const updateAdminOrderSchema = z.object({
  paymentStatus: adminPaymentStatusSchema,
  deliveryStatus: adminDeliveryStatusSchema,
  trackingCode: z.string().trim().max(120).optional().default(''),
  logisticsCompany: z.string().trim().max(120).optional().default(''),
  logisticsNotes: z.string().trim().max(1000).optional().default(''),
});

export function formatAdminOrderCode(order: { id: string; createdAt: Date }) {
  const date = order.createdAt;
  const dateCode = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  return `${dateCode}-${order.id.slice(-7)}`;
}

function nullableTrim(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeAdminOrderUpdate(input: unknown) {
  const body = updateAdminOrderSchema.parse(input);

  return {
    paymentStatus: body.paymentStatus,
    status: body.deliveryStatus,
    trackingCode: nullableTrim(body.trackingCode),
    logisticsCompany: nullableTrim(body.logisticsCompany),
    logisticsNotes: nullableTrim(body.logisticsNotes),
  };
}

export function getAdminDisplayDeliveryStatus(status: LegacyOrderStatus) {
  if (status === 'PROCESSING') return 'CONFIRMED';
  if (status === 'SHIPPED') return 'ON_THE_WAY';
  return status;
}

export function getAdminOrderSellerSummary(items: AdminSalesOrderItemLike[]) {
  const names = items
    .map((item) => item.sellerProduct?.seller.shopName || item.product.soldBy)
    .filter((value): value is string => Boolean(value));

  return [...new Set(names)].join(', ') || 'N/A';
}

function getAdminOrderSellerEmailSummary(items: AdminSalesOrderItemLike[]) {
  const emails = items
    .map((item) => item.sellerProduct?.seller.email)
    .filter((value): value is string => Boolean(value));

  return [...new Set(emails)].join(', ') || 'N/A';
}

export function mapAdminSalesOrder(order: {
  id: string;
  status: string;
  paymentStatus?: string | null;
  trackingCode?: string | null;
  logisticsCompany?: string | null;
  logisticsNotes?: string | null;
  total: unknown;
  createdAt: Date;
  paymentMethod: string | null;
  deliveryType: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  shippingAddress: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
    country: string;
    phone?: string | null;
  };
  items: Array<
    AdminSalesOrderItemLike & {
      id: string;
      productId: string;
      sellerProductId: string | null;
      quantity: number;
      price: unknown;
    }
  >;
}) {
  const amount = Number(order.total);
  const productCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: order.id,
    code: formatAdminOrderCode(order),
    status: order.status,
    deliveryStatus: getAdminDisplayDeliveryStatus(order.status as LegacyOrderStatus),
    paymentStatus: order.paymentStatus || 'UNPAID',
    amount,
    productCount,
    date: order.createdAt,
    paymentMethod: order.paymentMethod,
    deliveryType: order.deliveryType,
    trackingCode: order.trackingCode || null,
    logisticsCompany: order.logisticsCompany || null,
    logisticsNotes: order.logisticsNotes || null,
    customer: {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone,
    },
    shippingAddress: order.shippingAddress,
    shop: getAdminOrderSellerSummary(order.items),
    sellerEmail: getAdminOrderSellerEmailSummary(order.items),
    items: order.items.map((item) => {
      const price = Number(item.price);

      return {
        id: item.id,
        productId: item.productId,
        sellerProductId: item.sellerProductId,
        name: item.sellerProduct?.name || item.product.name || 'Untitled product',
        image: item.sellerProduct?.images?.[0] || item.product.images?.[0] || null,
        quantity: item.quantity,
        price,
        lineTotal: price * item.quantity,
        seller: item.sellerProduct?.seller || null,
      };
    }),
  };
}

function startOfUtcDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function endOfUtcDay(date: string) {
  return new Date(`${date}T23:59:59.999Z`);
}

function buildOrderDeletionPreview(order: {
  id: string;
  createdAt: Date;
  status: string;
  total: unknown;
  sellerBalanceSellerId: string | null;
  sellerWalletDelta: unknown;
  sellerPendingDelta: unknown;
  financialMovementsRecorded: boolean;
  user: { name: string; email: string };
  items: Array<{
    quantity: number;
    sellerProduct: { sellerId: string; seller: { shopName: string; email: string } } | null;
  }>;
}) {
  const sellerId =
    order.sellerBalanceSellerId ||
    order.items.find((item) => item.sellerProduct?.sellerId)?.sellerProduct?.sellerId ||
    null;
  const reversal = getOrderDeletionReversal({
    status: order.status,
    total: Number(order.total),
    sellerId,
    walletDelta: Number(order.sellerWalletDelta),
    pendingDelta: Number(order.sellerPendingDelta),
    hasRecordedMovements: order.financialMovementsRecorded,
  });
  const seller = order.items.find((item) => item.sellerProduct?.sellerId === sellerId)?.sellerProduct?.seller;

  return {
    order: {
      id: order.id,
      code: formatAdminOrderCode(order),
      customerName: order.user.name,
      customerEmail: order.user.email,
      amount: Number(order.total),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    },
    adjustments: reversal
      ? [{
          ...reversal,
          shopName: seller?.shopName || 'Seller',
          sellerEmail: seller?.email || '',
        }]
      : [],
  };
}

const deletionPreviewInclude = {
  user: { select: { name: true, email: true } },
  items: {
    select: {
      quantity: true,
      sellerProduct: {
        select: {
          sellerId: true,
          seller: { select: { shopName: true, email: true } },
        },
      },
    },
  },
} as const;

export default async function adminSalesRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/admin/sales/orders',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const query = salesQuerySchema.parse(request.query);
      const skip = (query.page - 1) * query.limit;
      const where: Record<string, unknown> = {};

      if (query.status !== 'ALL') {
        where.status = query.status;
      }

      if (query.date) {
        where.createdAt = {
          gte: startOfUtcDay(query.date),
          lte: endOfUtcDay(query.date),
        };
      }

      if (query.q) {
        where.OR = [
          { id: { contains: query.q, mode: 'insensitive' } },
          { user: { name: { contains: query.q, mode: 'insensitive' } } },
          { user: { email: { contains: query.q, mode: 'insensitive' } } },
        ];
      }

      if (query.seller) {
        where.items = {
          some: {
            OR: [
              {
                sellerProduct: {
                  seller: {
                    OR: [
                      { email: { contains: query.seller, mode: 'insensitive' } },
                      { shopName: { contains: query.seller, mode: 'insensitive' } },
                    ],
                  },
                },
              },
              { product: { soldBy: { contains: query.seller, mode: 'insensitive' } } },
            ],
          },
        };
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: query.limit,
          include: {
            user: true,
            shippingAddress: true,
            items: {
              include: {
                product: true,
                sellerProduct: {
                  include: {
                    seller: {
                      select: {
                        id: true,
                        email: true,
                        shopName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      return reply.send({
        data: orders.map(mapAdminSalesOrder),
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    }
  );

  fastify.get(
    '/api/admin/sales/orders/:id',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: true,
          shippingAddress: true,
          items: {
            include: {
              product: true,
              sellerProduct: {
                include: {
                  seller: {
                    select: {
                      id: true,
                      email: true,
                      shopName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      return reply.send({ data: mapAdminSalesOrder(order) });
    }
  );

  fastify.get(
    '/api/admin/sales/orders/:id/deletion-preview',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const order = await prisma.order.findUnique({ where: { id }, include: deletionPreviewInclude });
      if (!order) return reply.status(404).send({ error: 'Order not found' });
      return reply.send({ data: buildOrderDeletionPreview(order) });
    },
  );

  fastify.delete(
    '/api/admin/sales/orders/:id',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id }, include: deletionPreviewInclude });
        if (!order) return { ok: false as const, code: 'NOT_FOUND' as const };

        const preview = buildOrderDeletionPreview(order);
        for (const adjustment of preview.adjustments) {
          const seller = await tx.seller.findUnique({
            where: { id: adjustment.sellerId },
            select: { walletMoney: true, pendingBalance: true },
          });
          if (!seller) return { ok: false as const, code: 'SELLER_NOT_FOUND' as const };

          const nextWallet = Number(seller.walletMoney) + adjustment.walletAdjustment;
          const nextPending = Number(seller.pendingBalance) + adjustment.pendingAdjustment;
          if (nextWallet < 0 || nextPending < 0) {
            return { ok: false as const, code: 'INSUFFICIENT_BALANCE' as const, preview };
          }

          await tx.seller.update({
            where: { id: adjustment.sellerId },
            data: {
              walletMoney: { increment: adjustment.walletAdjustment },
              pendingBalance: { increment: adjustment.pendingAdjustment },
            },
          });
        }

        await tx.order.delete({ where: { id } });
        return { ok: true as const, preview };
      });

      if (!result.ok) {
        if (result.code === 'NOT_FOUND') return reply.status(404).send({ error: 'Order not found' });
        if (result.code === 'SELLER_NOT_FOUND') return reply.status(409).send({ error: 'The linked seller no longer exists' });
        return reply.status(409).send({
          error: 'Seller balances are too low to reverse this order. Correct the balances before deleting it.',
          data: result.preview,
        });
      }

      return reply.send({ data: { deletedOrderId: id, ...result.preview } });
    },
  );

  fastify.patch(
    '/api/admin/sales/orders/:id',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = normalizeAdminOrderUpdate(request.body);

      const existingOrder = await prisma.order.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingOrder) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const order = await updateOrderStatusWithFinancials(id, data.status);

      return reply.send({ data: mapAdminSalesOrder(order) });
    }
  );

  fastify.post(
    '/api/admin/sales/orders/:id/release-frozen-funds',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const result = await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id },
            include: { items: { select: { sellerProduct: { select: { sellerId: true } } } } },
          });
          if (!order) return { ok: false as const, code: 'NOT_FOUND' as const };
          if (order.frozenFundsReleasedAt) return { ok: false as const, code: 'ALREADY_RELEASED' as const };

          const sellerId = order.sellerBalanceSellerId || order.items.find((item) => item.sellerProduct?.sellerId)?.sellerProduct?.sellerId;
          if (!sellerId) return { ok: false as const, code: 'NO_SELLER' as const };

          const frozenAmount = Math.round(Number(order.total) * 0.85 * 100) / 100;
          const legacyReversal = getOrderDeletionReversal({
            status: order.status,
            total: Number(order.total),
            sellerId,
            walletDelta: Number(order.sellerWalletDelta),
            pendingDelta: Number(order.sellerPendingDelta),
            hasRecordedMovements: order.financialMovementsRecorded,
          });
          const currentWalletDelta = order.financialMovementsRecorded ? Number(order.sellerWalletDelta) : -(legacyReversal?.walletAdjustment || 0);
          const currentPendingDelta = order.financialMovementsRecorded ? Number(order.sellerPendingDelta) : -(legacyReversal?.pendingAdjustment || 0);

          const updatedSeller = await tx.seller.update({
            where: { id: sellerId },
            data: { walletMoney: { increment: frozenAmount } },
          });
          const updatedOrder = await tx.order.update({
            where: { id },
            data: {
              sellerBalanceSellerId: sellerId,
              sellerWalletDelta: currentWalletDelta + frozenAmount,
              sellerPendingDelta: currentPendingDelta,
              financialMovementsRecorded: true,
              frozenFundsReleasedAt: new Date(),
            },
            include: {
            user: true,
            shippingAddress: true,
            items: {
              include: {
                product: true,
                sellerProduct: {
                  include: {
                    seller: {
                      select: {
                        id: true,
                        email: true,
                        shopName: true,
                      },
                    },
                  },
                },
              },
            },
            },
          });
          return { ok: true as const, updatedSeller, updatedOrder };
        });

        if (!result.ok) {
          if (result.code === 'NOT_FOUND') return reply.status(404).send({ error: 'Order not found' });
          if (result.code === 'ALREADY_RELEASED') return reply.status(409).send({ error: 'Frozen funds were already released for this order' });
          return reply.status(400).send({ error: 'No seller found for this order' });
        }

        return reply.send({
          data: mapAdminSalesOrder(result.updatedOrder),
          wallet: {
            walletMoney: Number(result.updatedSeller.walletMoney),
          },
        });
      } catch (error: any) {
        console.error('Release frozen funds error:', error);
        return reply.status(500).send({ error: 'Failed to release frozen funds' });
      }
    }
  );
}
