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
  storeSlug?: string;
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
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
  
  const href = storeSlug ? `/products/${product.slug}?store=${storeSlug}` : `/products/${product.slug}`;

  let images: string[] = [];
  if (Array.isArray(product.images)) {
    images = product.images;
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      images = Array.isArray(parsed) ? parsed : [product.images];
    } catch {
      images = [product.images];
    }
  }

  return (
    <Link href={href} className="block h-full group/card">
      <Card className="h-full overflow-hidden border border-border/70 rounded-md bg-card p-0 gap-0 transition-all duration-300 hover:border-foreground/40 hover:shadow-card-hover flex flex-col">
        {/* Product Image Frame */}
        <div className="relative aspect-square overflow-hidden bg-muted/40 shrink-0">
          {images && images.length > 0 ? (
            <img
              src={images[0]}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover/card:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-xs uppercase tracking-widest text-muted-foreground">
              Aventura Curated
            </div>
          )}

          {/* Quick Action Overlay Buttons (Minimalist Luxury) */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-2 group-hover/card:translate-x-0">
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
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold line-clamp-1">
              {(product as any).soldBy || ((product as any).seller?.shopName) || 'Storehouse'}
            </span>
            <h3 className="font-medium text-foreground text-xs sm:text-sm line-clamp-2 leading-snug group-hover/card:underline underline-offset-4 transition-all">
              {product.name}
            </h3>
          </div>

          <div className="flex items-baseline justify-between pt-2 mt-auto border-t border-border/40">
            {/* Left side: Rating and Reviews */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">
                {Number((product as any).averageRating || 0).toFixed(1)}
              </span>
              <span>
                ({(product as any).reviewCount || 0})
              </span>
            </div>

            {/* Right side: Price */}
            <div className="flex items-baseline gap-2 text-right">
              {compareAtPriceNum > priceNum && (
                <span className="text-xs text-muted-foreground line-through font-normal">
                  {formatPrice(compareAtPriceNum)}
                </span>
              )}
              <span className="font-bold text-sm sm:text-base text-foreground font-sans tracking-tight">
                {formatPrice(Number(product.price))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
