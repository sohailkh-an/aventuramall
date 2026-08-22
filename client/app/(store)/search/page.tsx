import { apiClient } from '@/lib/api';
import { Product, Category } from '@tiktokshop/shared';
import { SearchClient } from '@/components/store/SearchClient';

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
  };
}

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';
  const categoryParam = typeof params.category === 'string' ? params.category : '';

  let products: ProductWithCategory[] = [];
  let allCategories: Category[] = [];
  let stores: PublicStore[] = [];

  try {
    let searchUrl = `/api/products?limit=100`;
    if (query) searchUrl += `&search=${encodeURIComponent(query)}`;
    if (categoryParam) searchUrl += `&category=${encodeURIComponent(categoryParam)}`;

    const storesUrl = query
      ? `/api/stores?search=${encodeURIComponent(query)}&limit=8`
      : '/api/stores?limit=8';

    const [productsRes, categoriesRes, storesRes] = await Promise.all([
      apiClient.get<{ data: ProductWithCategory[] }>(searchUrl),
      apiClient.get<{ data: Category[] }>('/api/categories'),
      apiClient.get<{ data: PublicStore[] }>(storesUrl),
    ]);

    products = productsRes.data || [];
    allCategories = categoriesRes.data || [];
    stores = storesRes.data || [];
  } catch (error) {
    console.error('Failed to fetch search results or categories:', error);
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <SearchClient
        initialProducts={products}
        initialStores={stores}
        searchQuery={query}
        allCategories={allCategories}
        initialCategory={categoryParam}
      />
    </div>
  );
}
