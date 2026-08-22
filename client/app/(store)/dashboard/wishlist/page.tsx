"use client";

import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCard } from "@/components/store/product-card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function WishlistPage() {
  const { wishlistItems, clearWishlist } = useWishlist();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Wishlist</h1>
          <p className="text-slate-500 mt-1">
            {wishlistItems.length} {wishlistItems.length === 1 ? "product" : "products"} saved
          </p>
        </div>
        
        {wishlistItems.length > 0 && (
          <Button variant="outline" onClick={clearWishlist} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            Clear Wishlist
          </Button>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-24 h-24 mb-6 rounded-full bg-slate-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Your wishlist is empty</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            Looks like you haven't added any products to your wishlist yet.
          </p>
          <Link href="/products" className={buttonVariants()}>Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
