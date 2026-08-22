import { Product } from '@tiktokshop/shared';
import { ProductCard } from './product-card';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

interface TodaysDealsProps {
  products: Product[];
}

export function TodaysDeals({ products }: TodaysDealsProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Todays Deals</h2>
          <p className="text-muted-foreground mt-1">Dont miss out on these limited time offers.</p>
        </div>
        <Link
          href="/products"
          className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}
        >
          View All Deals
        </Link>
      </div>

      <div className="bg-background grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {products.slice(0, 10).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
