import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAdminAuth } from '../middleware/auth.js';

type PosPrice = number | string | { toString(): string };

interface PosProductForOrder {
  id: string;
  sourceProductId: string;
  price: PosPrice;
  stock: number;
}

interface PosOrderInputItem {
  sellerProductId: string;
  quantity: number;
}

const searchQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const productQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  brand: z.string().trim().optional().default(''),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(60).default(24),
});

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

const createPosOrderSchema = z.object({
  sellerId: z.string().cuid(),
  customerId: z.string().cuid(),
  shippingAddressId: z.string().cuid(),
  items: z
    .array(
      z.object({
        sellerProductId: z.string().cuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

function priceToCents(price: PosPrice) {
  return Math.round(Number(price.toString()) * 100);
}

export function calculatePosOrderTotal(
  products: PosProductForOrder[],
  items: PosOrderInputItem[]
) {
  const productMap = new Map(products.map((product) => [product.id, product]));

  const cents = items.reduce((total, item) => {
    const product = productMap.get(item.sellerProductId);
    if (!product) return total;
    return total + priceToCents(product.price) * item.quantity;
  }, 0);

  return cents / 100;
}

export function buildPosOrderItems(
  products: PosProductForOrder[],
  items: PosOrderInputItem[]
) {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productMap.get(item.sellerProductId);
    if (!product) throw new Error(`Seller product ${item.sellerProductId} not found`);

    return {
      productId: product.sourceProductId,
      sellerProductId: product.id,
      quantity: item.quantity,
      price: priceToCents(product.price) / 100,
    };
  });
}

export function validatePosStock(
  products: PosProductForOrder[],
  items: PosOrderInputItem[]
) {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items
    .filter((item) => {
      const product = productMap.get(item.sellerProductId);
      return !product || product.stock < item.quantity;
    })
    .map((item) => item.sellerProductId);
}

function getProductWhere(sellerId: string, query: z.infer<typeof productQuerySchema>) {
  const nameFilters = [query.search, query.brand].filter(Boolean);

  return {
    sellerId,
    isActive: true,
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(nameFilters.length
      ? {
          AND: nameFilters.map((value) => ({
            name: { contains: value, mode: 'insensitive' as const },
          })),
        }
      : {}),
  };
}

function guessBrandName(productName: string) {
  return productName.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9&'-]/g, '') || '';
}

function getErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) return 'Invalid input';
  return error instanceof Error ? error.message : 'Internal server error';
}

export default async function adminPosRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/admin/pos/sellers',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { search, limit } = searchQuerySchema.parse(request.query);

      const sellers = await prisma.seller.findMany({
        where: search
          ? {
              OR: [
                { shopName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: {
          id: true,
          email: true,
          shopName: true,
          name: true,
          status: true,
          shopLogo: true,
        },
        orderBy: { shopName: 'asc' },
        take: limit,
      });

      return reply.send({ data: sellers });
    }
  );

  fastify.get(
    '/api/admin/pos/sellers/:sellerId/products',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { sellerId } = request.params as { sellerId: string };
      const query = productQuerySchema.parse(request.query);
      const skip = (query.page - 1) * query.limit;
      const where = getProductWhere(sellerId, query);

      const [products, total] = await Promise.all([
        prisma.sellerProduct.findMany({
          where,
          skip,
          take: query.limit,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.sellerProduct.count({ where }),
      ]);

      return reply.send({
        data: products,
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
    '/api/admin/pos/sellers/:sellerId/filters',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { sellerId } = request.params as { sellerId: string };
      const products = await prisma.sellerProduct.findMany({
        where: { sellerId, isActive: true },
        select: {
          name: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { name: 'asc' },
      });

      const categories = Array.from(
        new Map(products.map((product) => [product.category.slug, product.category])).values()
      );
      const brands = Array.from(
        new Set(products.map((product) => guessBrandName(product.name)).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      return reply.send({ data: { categories, brands } });
    }
  );

  fastify.get(
    '/api/admin/pos/customers',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { search, limit } = searchQuerySchema.parse(request.query);

      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          walletBalance: true,
          package: true,
        },
        orderBy: { name: 'asc' },
        take: limit,
      });

      return reply.send({ data: customers });
    }
  );

  fastify.get(
    '/api/admin/pos/customers/:customerId/addresses',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { customerId } = request.params as { customerId: string };
      const addresses = await prisma.address.findMany({
        where: { userId: customerId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      return reply.send({ data: addresses });
    }
  );

  fastify.post(
    '/api/admin/pos/customers/:customerId/addresses',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      const { customerId } = request.params as { customerId: string };
      const body = addressSchema.parse(request.body);

      const customer = await prisma.user.findFirst({
        where: { id: customerId, role: 'CUSTOMER' },
      });
      if (!customer) return reply.status(404).send({ error: 'Customer not found' });

      if (body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: { ...body, userId: customerId },
      });

      return reply.status(201).send({ data: address });
    }
  );

  fastify.post(
    '/api/admin/pos/orders',
    { preHandler: [requireAdminAuth] },
    async (request, reply) => {
      try {
        const body = createPosOrderSchema.parse(request.body);
        const uniqueSellerProductIds = [...new Set(body.items.map((item) => item.sellerProductId))];

        const order = await prisma.$transaction(async (tx) => {
          const [seller, customer, address, products] = await Promise.all([
            tx.seller.findUnique({ where: { id: body.sellerId }, select: { id: true } }),
            tx.user.findFirst({
              where: { id: body.customerId, role: 'CUSTOMER' },
              select: { id: true, walletBalance: true },
            }),
            tx.address.findFirst({
              where: { id: body.shippingAddressId, userId: body.customerId },
              select: { id: true },
            }),
            tx.sellerProduct.findMany({
              where: {
                id: { in: uniqueSellerProductIds },
                sellerId: body.sellerId,
                isActive: true,
              },
              select: {
                id: true,
                sourceProductId: true,
                price: true,
                stock: true,
              },
            }),
          ]);

          if (!seller) throw new Error('Seller not found');
          if (!customer) throw new Error('Customer not found');
          if (!address) throw new Error('Select a valid customer address');
          if (products.length !== uniqueSellerProductIds.length) {
            throw new Error('One or more selected products are not available for this seller');
          }

          const insufficientStockIds = validatePosStock(products, body.items);
          if (insufficientStockIds.length) {
            throw new Error('One or more products do not have enough stock');
          }

          const total = calculatePosOrderTotal(products, body.items);
          // const walletUpdate = await tx.user.updateMany({
          //   where: {
          //     id: body.customerId,
          //     walletBalance: { gte: total },
          //     isBanned: false,
          //   },
          //   data: { walletBalance: { decrement: total } },
          // });

          // if (walletUpdate.count !== 1) {
          //   throw new Error('Customer wallet balance is not enough for this order');
          // }

          for (const item of body.items) {
            const stockUpdate = await tx.sellerProduct.updateMany({
              where: {
                id: item.sellerProductId,
                sellerId: body.sellerId,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            });

            if (stockUpdate.count !== 1) {
              throw new Error('One or more products do not have enough stock');
            }
          }

          return tx.order.create({
            data: {
              userId: body.customerId,
              status: 'PENDING',
              total,
              shippingAddressId: body.shippingAddressId,
              paymentMethod: 'WALLET',
              deliveryType: 'POS',
              items: { create: buildPosOrderItems(products, body.items) },
            },
            include: {
              user: true,
              shippingAddress: true,
              items: {
                include: {
                  product: true,
                  sellerProduct: true,
                },
              },
            },
          });
        });

        return reply.status(201).send({ data: order });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid input', details: error.errors });
        }

        return reply.status(400).send({ error: getErrorMessage(error) });
      }
    }
  );
}
