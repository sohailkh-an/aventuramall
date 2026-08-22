'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@aventuramall/shared';
import { RefreshCw, ShoppingBag, Heart, Star } from 'lucide-react';
import { useCompare } from '@/hooks/use-compare';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/use-currency';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCompare, isInCompare } = useCompare();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { data: session } = useSession();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const priceNum = Number(product.price);
  const compareAtPriceNum = product.compareAtPrice ? Number(product.compareAtPrice) : 0;
  const discount =
    compareAtPriceNum > priceNum
      ? Math.round(((compareAtPriceNum - priceNum) / compareAtPriceNum) * 100)
      : 0;

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(product);
  };

  return (
    <Link href={`/products/${product.slug}`} className="block h-full group">
      <Card className="h-full overflow-hidden border border-border/70 rounded-md bg-card p-0 gap-0 transition-all duration-300 hover:border-foreground/40 hover:shadow-card-hover flex flex-col">
        {/* Product Image Frame */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted/40 shrink-0">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-xs uppercase tracking-widest text-muted-foreground">
              Aventura Curated
            </div>
          )}

          {/* Quick Action Overlay Buttons (Minimalist Luxury) */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <Button
              variant="outline"
              size="icon-sm"
              className={`rounded-full bg-background/90 backdrop-blur-md shadow-sm border border-border hover:bg-foreground hover:text-background transition-all ${
                isInWishlist(product.id) ? 'bg-foreground text-background' : 'text-foreground'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!session) {
                  router.push('/login');
                  return;
                }
                toggleWishlist(product);
              }}
              title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              className={`rounded-full bg-background/90 backdrop-blur-md shadow-sm border border-border hover:bg-foreground hover:text-background transition-all ${
                isInCompare(product.id) ? 'bg-foreground text-background' : 'text-foreground'
              }`}
              onClick={handleCompare}
              title="Compare"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              className={`rounded-full bg-background/90 backdrop-blur-md shadow-sm border border-border hover:bg-foreground hover:text-background transition-all ${
                isInCart(product.id) ? 'bg-foreground text-background' : 'text-foreground'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!session) {
                  router.push('/login');
                  return;
                }
                addToCart(product);
              }}
              title="Add to Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Minimalist Discount Pill */}
          {discount > 0 && (
            <Badge
              variant="editorial"
              className="absolute top-2.5 left-2.5 bg-background/95 backdrop-blur-md shadow-sm border border-border text-[10px]"
            >
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Product Details */}
        <CardContent className="p-3.5 sm:p-4 flex flex-col flex-1 gap-1.5 justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Maison Collection
            </span>
            <h3 className="font-medium text-foreground text-xs sm:text-sm line-clamp-2 leading-snug group-hover:underline underline-offset-4 transition-all">
              {product.name}
            </h3>
          </div>

          <div className="flex items-baseline justify-between pt-2 mt-auto border-t border-border/40">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm sm:text-base text-foreground font-serif tracking-tight">
                {formatPrice(Number(product.price))}
              </span>
              {compareAtPriceNum > priceNum && (
                <span className="text-xs text-muted-foreground line-through font-normal">
                  {formatPrice(compareAtPriceNum)}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium group-hover:text-foreground transition-colors">
              Details →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
