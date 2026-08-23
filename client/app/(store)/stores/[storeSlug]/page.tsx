import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Category, Product } from '@aventuramall/shared';
import { ArrowLeft, Boxes, ChevronLeft, ChevronRight, Star, Store, Tag } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ProductCard } from '@/components/store/product-card';

const PRODUCTS_PER_PAGE = 20;

export const revalidate = 60;

interface ProductWithCategory extends Product {
  category: Category;
}

interface PublicStore {
  name: string;
  slug: string;
  productCount: number;
  categories: string[];
  ratingStats: {
    averageRating: number;
    reviewCount: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

interface PublicStoreResponse {
  data: {
    store: PublicStore;
    products: ProductWithCategory[];
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StorePageProps {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { storeSlug } = await params;
  const paramsValue = await searchParams;
  const pageParam = Array.isArray(paramsValue.page) ? paramsValue.page[0] : paramsValue.page;
  const currentPage = Math.max(Number(pageParam) || 1, 1);

  let storeData: PublicStoreResponse | null = null;

  try {
    storeData = await apiClient.get<PublicStoreResponse>(
      `/api/stores/${encodeURIComponent(storeSlug)}?page=${currentPage}&limit=${PRODUCTS_PER_PAGE}`
    );
  } catch (error) {
    console.error('Failed to fetch store:', error);
  }

  if (!storeData) {
    notFound();
  }

  const { store, products } = storeData.data;
  const totalPages = storeData.meta.totalPages;
  const showPagination = storeData.meta.total > PRODUCTS_PER_PAGE;
  const pageHref = (page: number) => `/stores/${store.slug}?page=${page}`;
  const ratingPercent = (count: number) =>
    store.ratingStats.reviewCount > 0
      ? Math.round((count / store.ratingStats.reviewCount) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border/70 bg-dull">
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to storefront
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-brand text-white shadow-sm sm:h-24 sm:w-24">
                <Store className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-normal text-brand">
                  Storefront
                </p>
                <h1 className="mt-1 text-3xl font-black leading-tight text-foreground sm:text-4xl">
                  {store.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Browse products listed by this seller, grouped from the live storefront catalog.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:max-w-xl lg:grid-cols-3 lg:justify-self-end">
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Boxes className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-normal">Products</span>
                </div>
                <p className="text-2xl font-black text-foreground">{store.productCount}</p>
              </div>
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-normal">Categories</span>
                </div>
                <p className="text-2xl font-black text-foreground">{store.categories.length}</p>
              </div>
              <div className="col-span-2 rounded-md border border-border/70 bg-background p-4 lg:col-span-1">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-normal">Rating</span>
                </div>
                <p className="text-2xl font-black text-foreground">
                  {store.ratingStats.reviewCount > 0
                    ? store.ratingStats.averageRating.toFixed(1)
                    : 'No ratings'}
                </p>
              </div>
            </div>
          </div>

          {store.categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {store.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-bold text-foreground"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-md border border-border/70 bg-background p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Rating stats</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {store.ratingStats.reviewCount > 0
                    ? `${store.ratingStats.reviewCount} customer reviews across this store`
                    : 'No customer ratings yet for this store.'}
                </p>
              </div>
              <div className="grid min-w-0 flex-1 gap-2 md:max-w-md">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count =
                    store.ratingStats.distribution[
                      rating as keyof typeof store.ratingStats.distribution
                    ];
                  const percent = ratingPercent(count);

                  return (
                    <div key={rating} className="grid grid-cols-[44px_1fr_34px] items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                        {rating}
                        <Star className="h-3 w-3 fill-[#ffb900] text-[#ffb900]" />
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-[#ffb900]"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="text-right text-xs font-bold text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-brand">
              Available now
            </p>
            <h2 className="text-2xl font-bold text-foreground">Products from {store.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {products.length} of {store.productCount}
            {showPagination ? ` • Page ${storeData.meta.page} of ${totalPages}` : ''}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={store.slug} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-border bg-muted/10 px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              This store does not have active products right now.
            </p>
          </div>
        )}

        {showPagination && (
          <nav className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {storeData.meta.page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {storeData.meta.page > 1 ? (
                <Link
                  href={pageHref(storeData.meta.page - 1)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-bold text-foreground transition-colors hover:border-brand hover:text-brand"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-muted px-3 text-sm font-bold text-muted-foreground opacity-60">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </span>
              )}

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (page) =>
                    page === 1 || page === totalPages || Math.abs(page - storeData.meta.page) <= 1
                )
                .map((page, index, pages) => {
                  const previousPage = pages[index - 1];
                  const showGap = previousPage && page - previousPage > 1;

                  return (
                    <span key={page} className="flex items-center gap-2">
                      {showGap && <span className="text-sm text-muted-foreground">...</span>}
                      <Link
                        href={pageHref(page)}
                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-bold transition-colors ${
                          page === storeData.meta.page
                            ? 'border-brand bg-brand text-white'
                            : 'border-border bg-background text-foreground hover:border-brand hover:text-brand'
                        }`}
                      >
                        {page}
                      </Link>
                    </span>
                  );
                })}

              {storeData.meta.page < totalPages ? (
                <Link
                  href={pageHref(storeData.meta.page + 1)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-bold text-foreground transition-colors hover:border-brand hover:text-brand"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-muted px-3 text-sm font-bold text-muted-foreground opacity-60">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
