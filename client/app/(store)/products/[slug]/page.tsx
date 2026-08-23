import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Product, Category } from '@aventuramall/shared';
import { ProductPageUI } from '@/components/store/product/ProductPageUI';

export const revalidate = 60;

interface ProductWithCategory extends Product {
  category: Category;
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const searchParamsObj = await searchParams;
  const storeQuery = typeof searchParamsObj.store === 'string' ? searchParamsObj.store : undefined;

  let product: ProductWithCategory | null = null;
  let relatedProducts: ProductWithCategory[] = [];
  try {
    const endpoint = storeQuery ? `/api/products/${slug}?store=${encodeURIComponent(storeQuery)}` : `/api/products/${slug}`;
    const res = await apiClient.get<{ data: ProductWithCategory }>(endpoint);
    product = res.data;
  } catch (error) {
    console.error('Failed to fetch product:', error);
  }

  if (product?.category?.slug) {
    try {
      const relatedRes = await apiClient.get<{ data: ProductWithCategory[] }>(
        `/api/products?category=${encodeURIComponent(product.category.slug)}&limit=9`
      );
      relatedProducts = relatedRes.data.filter((item) => item.id !== product.id).slice(0, 8);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    }
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen">
      <ProductPageUI product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
