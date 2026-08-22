import { apiClient } from '@/lib/api';
import { Product, Category } from '@aventuramall/shared';
import { HomeHero } from '@/components/store/HomeHero';
import { HomeCategories } from '@/components/store/HomeCategories';
import { HomeBanners } from '@/components/store/HomeBanners';
import { HomeBrands } from '@/components/store/HomeBrands';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ProductCard } from '@/components/store/product-card';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const revalidate = 60;

interface ProductWithCategory extends Product {
  category: Category;
}

export default async function StorePage() {
  let heroDeals: ProductWithCategory[] = [];
  try {
    const res = await apiClient.get<{ data: ProductWithCategory[] }>('/api/products?limit=20');
    const recent = res.data || [];
    heroDeals = recent.slice(0, 10);
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
  }

  const targetCategories = [
    { name: 'Womenswear & Haute Couture', slug: 'women-clothing-fashion' },
    { name: 'Menswear & Tailoring', slug: 'men-clothing-fashion' },
    { name: 'Fine Jewelry & Watches', slug: 'jewelry-watches' },
    { name: 'Living, Furniture & Art', slug: 'home-decoration-appliances' },
    { name: 'Tech & Lifestyle', slug: 'computer-accessories' },
    { name: 'Sporting & Activewear', slug: 'sports-outdoor' },
  ];

  const groupedProducts: Record<string, ProductWithCategory[]> = {};

  try {
    const categoryPromises = targetCategories.map((cat) =>
      apiClient
        .get<{ data: ProductWithCategory[] }>(`/api/products?category=${cat.slug}&limit=12`)
        .then((res) => ({ category: cat.name, products: res.data || [] }))
        .catch((err) => {
          console.error(`Failed to fetch category ${cat.slug}:`, err);
          return { category: cat.name, products: [] };
        })
    );

    const results = await Promise.all(categoryPromises);
    results.forEach((result) => {
      if (result.products.length > 0) {
        groupedProducts[result.category] = result.products;
      }
    });
  } catch (error) {
    console.error('Failed to fetch category groups:', error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Editorial Hero Slider & Spotlight */}
      <HomeHero dealProducts={heroDeals} />

      {/* Curated Category Grid */}
      <HomeCategories />

      {/* Campaign Banners */}
      <HomeBanners />

      {/* Department Product Collections */}
      <div className="container mx-auto px-4 py-8 flex flex-col gap-14">
        {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
          <section
            key={categoryName}
            className="w-full bg-card border border-border/80 p-6 md:p-8 rounded-lg shadow-card"
          >
            {/* Department Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-border/60 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
                  Department
                </span>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-serif">
                  {categoryName}
                </h2>
              </div>
              <Link
                href={`/search?category=${categoryProducts[0]?.category?.slug || 'all'}`}
                className={buttonVariants({
                  variant: 'editorial',
                  size: 'sm',
                  className: 'text-[11px]',
                })}
              >
                <span>Explore Department</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* Product Carousel */}
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full relative group"
            >
              <CarouselContent className="-ml-3 md:-ml-4">
                {categoryProducts.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="pl-3 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                  >
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <CarouselPrevious className="-left-4 lg:-left-5 bg-background/90 text-foreground border border-border shadow-md hover:bg-foreground hover:text-background" />
                <CarouselNext className="-right-4 lg:-right-5 bg-background/90 text-foreground border border-border shadow-md hover:bg-foreground hover:text-background" />
              </div>
            </Carousel>
          </section>
        ))}

        {Object.keys(groupedProducts).length === 0 && (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-border/80 shadow-card">
            <p className="text-sm font-serif">No products currently available in this curation.</p>
          </div>
        )}
      </div>

      {/* Iconic Brands Directory */}
      <HomeBrands />
    </div>
  );
}
