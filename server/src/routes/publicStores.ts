import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';

const storeProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
});

const storeSearchQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  limit: z.coerce.number().int().min(1).max(24).default(8),
});

interface PublicStoreProductLike {
  soldBy: string | null;
  isActive: boolean;
  category?: {
    name?: string | null;
  } | null;
  reviews?: Array<{
    rating?: number | null;
  }> | null;
}

export function slugifyStoreName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function filterProductsByStoreSlug<T extends PublicStoreProductLike>(
  products: T[],
  storeSlug: string
) {
  return products.filter((product) => {
    if (!product.isActive || !product.soldBy) return false;
    return slugifyStoreName(product.soldBy) === storeSlug;
  });
}

export function calculateStoreRatingStats(products: Array<Pick<PublicStoreProductLike, 'reviews'>>) {
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  const ratings = products.flatMap((product) =>
    (product.reviews ?? [])
      .map((review) => Number(review.rating))
      .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5)
  );

  for (const rating of ratings) {
    const roundedRating = Math.round(rating) as keyof typeof distribution;
    distribution[roundedRating] += 1;
  }

  return {
    averageRating:
      ratings.length > 0
        ? Number((ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1))
        : 0,
    reviewCount: ratings.length,
    distribution,
  };
}

export function buildPublicStoreSummary<T extends PublicStoreProductLike>(
  storeSlug: string,
  products: T[]
) {
  const storeProducts = filterProductsByStoreSlug(products, storeSlug);
  const firstProduct = storeProducts[0];

  if (!firstProduct?.soldBy) return null;

  return {
    name: firstProduct.soldBy,
    slug: storeSlug,
    productCount: storeProducts.length,
    ratingStats: calculateStoreRatingStats(storeProducts),
    categories: [
      ...new Set(
        storeProducts
          .map((product) => product.category?.name)
          .filter((name): name is string => Boolean(name))
      ),
    ].sort((a, b) => a.localeCompare(b)),
  };
}

export function buildPublicStoreSearchResults<T extends PublicStoreProductLike>(
  products: T[],
  search: string,
  limit = 8
) {
  const normalizedSearch = search.trim().toLowerCase();
  const storesBySlug = new Map<string, T[]>();

  for (const product of products) {
    if (!product.isActive || !product.soldBy) continue;

    const slug = slugifyStoreName(product.soldBy);
    if (!slug) continue;

    const storeProducts = storesBySlug.get(slug) ?? [];
    storeProducts.push(product);
    storesBySlug.set(slug, storeProducts);
  }

  return [...storesBySlug.entries()]
    .map(([slug, storeProducts]) => buildPublicStoreSummary(slug, storeProducts))
    .filter((store): store is NonNullable<ReturnType<typeof buildPublicStoreSummary<T>>> => {
      if (!store) return false;
      if (!normalizedSearch) return true;

      return (
        store.name.toLowerCase().includes(normalizedSearch) ||
        store.slug.includes(normalizedSearch)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

export default async function publicStoreRoutes(fastify: FastifyInstance) {
  fastify.get('/api/stores', async (request, reply) => {
    const { search, limit } = storeSearchQuerySchema.parse(request.query);
    const normalizedSearch = search.trim().toLowerCase();

    // 1. Fetch products to get scraped stores
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        soldBy: { not: null },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    
    let storeSummaries = buildPublicStoreSearchResults(products, search, limit);

    // 2. Fetch real sellers
    const realSellers = await prisma.seller.findMany({
      where: search ? {
        shopName: { contains: search, mode: 'insensitive' }
      } : undefined,
      take: limit,
      include: {
        sellerProducts: {
          where: { isActive: true },
          include: { category: true, reviews: { select: { rating: true } } }
        }
      }
    });

    const realStoreSummaries = realSellers.map(seller => {
      const slug = slugifyStoreName(seller.shopName);
      return {
        name: seller.shopName,
        slug,
        productCount: seller.sellerProducts.length,
        ratingStats: calculateStoreRatingStats(seller.sellerProducts as any),
        categories: [
          ...new Set(
            seller.sellerProducts
              .map((product) => product.category?.name)
              .filter((name): name is string => Boolean(name))
          ),
        ].sort((a, b) => a.localeCompare(b)),
      };
    });

    // Merge them, prioritizing real sellers over scraped stores with the same slug
    const merged = new Map<string, typeof storeSummaries[0]>();
    for (const store of storeSummaries) {
      merged.set(store.slug, store);
    }
    for (const store of realStoreSummaries) {
      merged.set(store.slug, store);
    }

    return reply.send({
      data: [...merged.values()]
        .filter(store => !normalizedSearch || store.name.toLowerCase().includes(normalizedSearch) || store.slug.includes(normalizedSearch))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit),
    });
  });

  fastify.get('/api/stores/:storeSlug', async (request, reply) => {
    const { storeSlug } = request.params as { storeSlug: string };
    const { page, limit } = storeProductsQuerySchema.parse(request.query);
    const skip = (page - 1) * limit;

    // First try real sellers
    const allSellers = await prisma.seller.findMany();
    const realSeller = allSellers.find(s => slugifyStoreName(s.shopName) === storeSlug);

    if (realSeller) {
      const [sellerProducts, total] = await Promise.all([
        prisma.sellerProduct.findMany({
          where: { sellerId: realSeller.id, isActive: true },
          include: { category: true, reviews: { select: { rating: true } } },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.sellerProduct.count({ where: { sellerId: realSeller.id, isActive: true } }),
      ]);

      const store = {
        name: realSeller.shopName,
        slug: storeSlug,
        productCount: total,
        ratingStats: calculateStoreRatingStats(sellerProducts as any),
        categories: [
          ...new Set(
            sellerProducts
              .map((product) => product.category?.name)
              .filter((name): name is string => Boolean(name))
          ),
        ].sort((a, b) => a.localeCompare(b)),
      };

      return reply.send({
        data: {
          store,
          products: sellerProducts,
        },
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Fallback to scraped stores
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        soldBy: { not: null },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const matchingProducts = filterProductsByStoreSlug(products, storeSlug);
    const store = buildPublicStoreSummary(storeSlug, matchingProducts);

    if (!store) {
      return reply.status(404).send({ error: 'Store not found' });
    }

    const paginatedProducts = matchingProducts.slice(skip, skip + limit);

    return reply.send({
      data: {
        store,
        products: paginatedProducts,
      },
      meta: {
        page,
        limit,
        total: matchingProducts.length,
        totalPages: Math.ceil(matchingProducts.length / limit),
      },
    });
  });
}
