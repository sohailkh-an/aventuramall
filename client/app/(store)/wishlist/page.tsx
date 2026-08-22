'use client';

import { useWishlist } from '@/hooks/use-wishlist';
import { ProductCard } from '@/components/store/product-card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WishlistPage() {
  const { wishlistItems, clearWishlist } = useWishlist();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background py-12">
      <div className="container bg-dull mx-auto px-6 py-6 rounded-sm max-w-7xl min-h-[60vh]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Heart className="w-8 h-8 text-brand fill-brand" />
              My Wishlist
            </h1>
            <p className="text-muted-foreground mt-2">
              You have {wishlistItems.length} items saved.
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <Button
              variant="outline"
              className="text-foreground bg-foreground/5 border-foreground/20 hover:bg-foreground/10 hover:text-foreground"
              onClick={() => {
                if (confirm('Are you sure you want to clear your wishlist?')) {
                  clearWishlist();
                }
              }}
            >
              Clear Wishlist
            </Button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-12 text-center flex flex-col items-center max-w-2xl mx-auto mt-12">
            <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-zinc-300" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Your wishlist is empty</h2>
            <p className="text-zinc-500 mb-8 max-w-md">
              Looks like you haven't added any items to your wishlist yet. Explore our products and
              find something you love!
            </p>
            <Link href="/">
              <Button className="bg-brand hover:bg-brand/80 text-white px-8 h-12 rounded-full font-medium text-base inline-flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {wishlistItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
