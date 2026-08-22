import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { prisma } from '../db/client.js';
import { requireSellerAuth } from '../middleware/auth.js';
import { updateOrderStatusWithFinancials } from '../lib/orderStatus.js';

interface SellerOrderItemLike {
  quantity: number;
  price: number | string | { toString(): string };
}

interface SellerOrderLike {
  id: string;
  status: string;
  createdAt: Date;
  items: SellerOrderItemLike[];
}

const sellerOrdersQuerySchema = z.object({
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
  q: z.string().trim().optional().default(''),
});

const sellerDeliveryStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
]);

const updateSellerOrderDeliverySchema = z.object({
  deliveryStatus: sellerDeliveryStatusSchema,
});

function toCents(value: SellerOrderItemLike['price']) {
  return Math.round(Number(value.toString()) * 100);
}

export function calculateSellerOrderAmount(items: SellerOrderItemLike[]) {
  const cents = items.reduce((sum, item) => sum + toCents(item.price) * item.quantity, 0);
  return cents / 100;
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateSellerOrderProfit(amount: number, profitPercent: number) {
  return money(amount * (profitPercent / 100));
}

export function maskCustomerEmail(email: string) {
  const compact = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (compact.length <= 6) return compact;
  return `${compact.slice(0, 3)}************${compact.slice(-3)}`;
}

export function maskCustomerPhone(phone: string | null) {
  if (!phone) return null;
  const compact = phone.trim().replace(/\s+/g, '');
  if (compact.length <= 6) return compact;
  return `${compact.slice(0, 3)}********${compact.slice(-3)}`;
}

function maskAddressText(value: string) {
  const compact = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (compact.length <= 6) return compact || 'hidden';
  return `${compact.slice(0, 3)}************${compact.slice(-3)}`;
}

export function maskCustomerAddress(address: {
  street?: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  phone?: string | null;
}) {
  const compactAddress = [address.city, address.state, address.country]
    .filter(Boolean)
    .join(' ');

  return {
    city: maskAddressText(compactAddress),
    state: '',
    country: '',
  };
}

export function normalizeSellerOrderDeliveryUpdate(input: unknown) {
  const body = updateSellerOrderDeliverySchema.parse(input);

  return {
    status: body.deliveryStatus,
  };
}

export function formatSellerOrderCode(order: { id: string; createdAt: Date }) {
  const date = order.createdAt;
  const dateCode = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  return `${dateCode}-${order.id.slice(-7)}`;
}

export function summarizeSellerOrders(orders: SellerOrderLike[]) {
  return {
    totalOrders: orders.length,
    newOrders: orders.filter((order) => ['PENDING', 'PROCESSING', 'CONFIRMED'].includes(order.status)).length,
    cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
    onDeliveryOrders: orders.filter((order) => ['PICKED_UP', 'SHIPPED', 'ON_THE_WAY'].includes(order.status)).length,
    deliveredOrders: orders.filter((order) => order.status === 'DELIVERED').length,
    totalTurnover: orders.reduce((sum, order) => sum + calculateSellerOrderAmount(order.items), 0),
  };
}

function mapSellerOrder(order: {
  id: string;
  status: string;
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
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: unknown;
    sellerProduct: {
      id: string;
      name: string;
      images: string[];
    } | null;
    product: {
      id: string;
      name: string;
      images: string[];
    };
  }>;
}, profitPercent: number, options: { maskCustomer?: boolean } = {}) {
  const sellerAmount = calculateSellerOrderAmount(order.items as SellerOrderItemLike[]);
  const profit = calculateSellerOrderProfit(sellerAmount, profitPercent);

  return {
    id: order.id,
    code: formatSellerOrderCode(order),
    status: order.status,
    amount: sellerAmount,
    profitPercent,
    profit,
    productCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    deliveryType: order.deliveryType,
    customer: {
      id: order.user.id,
      name: order.user.name,
      ...(options.maskCustomer
        ? {
            email: maskCustomerEmail(order.user.email),
            phone: maskCustomerPhone(order.user.phone),
          }
        : {}),
    },
    shippingAddress: options.maskCustomer
      ? maskCustomerAddress(order.shippingAddress)
      : order.shippingAddress,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.sellerProduct?.name || item.product.name,
      image: item.sellerProduct?.images[0] || item.product.images[0] || null,
      quantity: item.quantity,
      price: Number(item.price),
      lineTotal: Number(item.price) * item.quantity,
    })),
  };
}

export default async function sellerOrdersRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/seller/orders/summary',
    { preHandler: [requireSellerAuth] },
    async (request, reply) => {
      const sellerPayload = (request as any).seller;

      const [seller, orders] = await Promise.all([
        prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            sellerPackage: {
              select: {
                profitPercent: true,
              },
            },
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

      const profitPercent = Number(seller?.sellerPackage?.profitPercent ?? 15);
      const summary = summarizeSellerOrders(orders);

      return reply.send({
        data: {
          ...summary,
          profitPercent,
          totalProfit: calculateSellerOrderProfit(summary.totalTurnover, profitPercent),
        },
      });
    }
  );

  fastify.get(
    '/api/seller/orders/:id',
    { preHandler: [requireSellerAuth] },
    async (request, reply) => {
      const sellerPayload = (request as any).seller;
      const { id } = request.params as { id: string };

      const [seller, order] = await Promise.all([
        prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            sellerPackage: {
              select: {
                profitPercent: true,
              },
            },
          },
        }),
        prisma.order.findFirst({
          where: {
            id,
            items: {
              some: {
                sellerProduct: {
                  sellerId: sellerPayload.userId,
                },
              },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            shippingAddress: true,
            items: {
              where: {
              sellerProduct: {
                sellerId: sellerPayload.userId,
              },
            },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
                sellerProduct: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const profitPercent = Number(seller?.sellerPackage?.profitPercent ?? 15);

      return reply.send({ data: mapSellerOrder(order, profitPercent, { maskCustomer: true }) });
    }
  );

  fastify.patch(
    '/api/seller/orders/:id',
    { preHandler: [requireSellerAuth] },
    async (request, reply) => {
      const sellerPayload = (request as any).seller;
      const { id } = request.params as { id: string };
      const data = normalizeSellerOrderDeliveryUpdate(request.body);

      const existingOrder = await prisma.order.findFirst({
        where: {
          id,
          items: {
            some: {
              sellerProduct: {
                sellerId: sellerPayload.userId,
              },
            },
          },
        },
        select: { id: true },
      });

      if (!existingOrder) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const [seller, order] = await Promise.all([
        prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            sellerPackage: {
              select: {
                profitPercent: true,
              },
            },
          },
        }),
        updateOrderStatusWithFinancials(id, data.status),
      ]);

      const profitPercent = Number(seller?.sellerPackage?.profitPercent ?? 15);

      return reply.send({ data: mapSellerOrder(order, profitPercent, { maskCustomer: true }) });
    }
  );

  fastify.get(
    '/api/seller/orders',
    { preHandler: [requireSellerAuth] },
    async (request, reply) => {
      const sellerPayload = (request as any).seller;
      const query = sellerOrdersQuerySchema.parse(request.query);
      const skip = (query.page - 1) * query.limit;
      const where: Record<string, unknown> = {
        items: {
          some: {
            sellerProduct: {
              sellerId: sellerPayload.userId,
            },
          },
        },
      };

      if (query.status !== 'ALL') {
        where.status = query.status;
      }

      if (query.q) {
        where.OR = [
          { id: { contains: query.q, mode: 'insensitive' } },
          { user: { name: { contains: query.q, mode: 'insensitive' } } },
        ];
      }

      const [seller, orders, total] = await Promise.all([
        prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            sellerPackage: {
              select: {
                profitPercent: true,
              },
            },
          },
        }),
        prisma.order.findMany({
          where,
          skip,
          take: query.limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            shippingAddress: true,
            items: {
              where: {
                sellerProduct: {
                  sellerId: sellerPayload.userId,
                },
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
                sellerProduct: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      const profitPercent = Number(seller?.sellerPackage?.profitPercent ?? 15);

      return reply.send({
        data: orders.map((order) => mapSellerOrder(order, profitPercent)),
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    }
  );

  // Payment for Storehouse endpoint
  fastify.post(
    '/api/seller/orders/:id/payment-for-storehouse',
    { preHandler: [requireSellerAuth] },
    async (request, reply) => {
      const sellerPayload = (request as any).seller;
      const { id } = request.params as { id: string };
      const { transactionPassword } = request.body as { transactionPassword: string };

      try {
        // Get seller
        const seller = await prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            transactionPassword: true,
            walletMoney: true,
            pendingBalance: true,
          },
        });

        if (!seller) {
          return reply.status(404).send({ error: 'Seller not found' });
        }

        // Validate transaction password
        const isPasswordValid = await bcryptjs.compare(transactionPassword, seller.transactionPassword);
        if (!isPasswordValid) {
          return reply.status(400).send({ error: 'Invalid transaction password.' });
        }

        // Get order with its items and seller products
        const order = await prisma.order.findFirst({
          where: {
            id,
            items: {
              some: {
                sellerProduct: {
                  sellerId: sellerPayload.userId,
                },
              },
            },
          },
          include: {
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
        });

        if (!order) {
          return reply.status(404).send({ error: 'Order not found' });
        }

        // Calculate order amount
        const orderAmount = calculateSellerOrderAmount(order.items as SellerOrderItemLike[]);
        const deductAmount = money(orderAmount * 0.85); // 85% of order amount

        // Check wallet balance
        if (Number(seller.walletMoney) < deductAmount) {
          return reply.status(400).send({ error: 'Insufficient wallet balance.' });
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
          // Update seller wallet and pending balance
          const updatedSeller = await tx.seller.update({
            where: { id: sellerPayload.userId },
            data: {
              walletMoney: {
                decrement: deductAmount,
              },
              pendingBalance: {
                increment: orderAmount,
              },
            },
            select: {
              walletMoney: true,
              pendingBalance: true,
            },
          });

          // Update order status to PICKED_UP
          const updatedOrder = await tx.order.update({
            where: { id },
            data: {
              status: 'PICKED_UP',
              sellerBalanceSellerId: sellerPayload.userId,
              sellerWalletDelta: { decrement: deductAmount },
              sellerPendingDelta: { increment: orderAmount },
              financialMovementsRecorded: true,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              shippingAddress: true,
              items: {
                where: {
                  sellerProduct: {
                    sellerId: sellerPayload.userId,
                  },
                },
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      images: true,
                    },
                  },
                  sellerProduct: {
                    select: {
                      id: true,
                      name: true,
                      images: true,
                    },
                  },
                },
              },
            },
          });

          return { updatedOrder, updatedSeller };
        });

        const sellerPackage = await prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            sellerPackage: {
              select: {
                profitPercent: true,
              },
            },
          },
        });

        const profitPercent = Number(sellerPackage?.sellerPackage?.profitPercent ?? 15);

        return reply.send({
          data: mapSellerOrder(result.updatedOrder, profitPercent, { maskCustomer: true }),
          wallet: {
            walletMoney: Number(result.updatedSeller.walletMoney),
            pendingBalance: Number(result.updatedSeller.pendingBalance),
          },
        });
      } catch (error: any) {
        console.error('Payment for storehouse error:', error);
        return reply.status(500).send({ error: 'Failed to process payment' });
      }
    }
  );
}
