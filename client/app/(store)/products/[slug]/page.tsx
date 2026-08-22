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
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product: ProductWithCategory | null = null;
  let relatedProducts: ProductWithCategory[] = [];
  try {
    const res = await apiClient.get<{ data: ProductWithCategory }>(`/api/products/${slug}`);
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
