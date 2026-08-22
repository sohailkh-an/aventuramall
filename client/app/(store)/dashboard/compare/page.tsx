"use client";

import { useCompare } from "@/hooks/use-compare";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { X, ShoppingCart } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCurrency } from "@/hooks/use-currency";

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compare Products</h1>
          <p className="text-slate-500 mt-1">
            {compareItems.length} {compareItems.length === 1 ? "product" : "products"} selected
          </p>
        </div>
        
        {compareItems.length > 0 && (
          <Button variant="outline" onClick={clearCompare} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            Clear List
          </Button>
        )}
      </div>

      {compareItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-24 h-24 mb-6 rounded-full bg-slate-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Nothing to compare</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            Add products to compare to see their features side by side.
          </p>
          <Link href="/products" className={buttonVariants()}>Browse Products</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border-0">
            <div className="flex w-max min-w-full">
              
              {/* Properties Column */}
              <div className="flex flex-col w-48 shrink-0 bg-slate-50 border-r border-slate-100">
                <div className="h-[280px] p-4 flex items-center justify-center border-b border-slate-100 font-medium text-slate-600">Product</div>
                <div className="h-16 p-4 flex items-center border-b border-slate-100 font-medium text-slate-600">Price</div>
                <div className="h-16 p-4 flex items-center border-b border-slate-100 font-medium text-slate-600">Stock</div>
                <div className="h-48 p-4 flex items-start pt-6 border-b border-slate-100 font-medium text-slate-600">Description</div>
                <div className="h-24 p-4 flex items-center justify-center font-medium text-slate-600">Action</div>
              </div>

              {/* Product Columns */}
              {compareItems.map((product) => (
                <div key={product.id} className="flex flex-col w-72 shrink-0 border-r border-slate-100 relative group">
                  <button 
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Product Header */}
                  <div className="h-[280px] p-6 border-b border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 relative mb-4 rounded-lg overflow-hidden bg-slate-50">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No image</div>
                      )}
                    </div>
                    <Link href={`/products/${product.slug}`} className="font-semibold text-slate-800 hover:text-brand line-clamp-2 text-wrap">
                      {product.name}
                    </Link>
                  </div>
                  
                  {/* Price */}
                  <div className="h-16 p-4 border-b border-slate-100 flex items-center justify-center font-bold text-brand text-lg">
                    {formatPrice(Number(product.price))}
                  </div>
                  
                  {/* Stock */}
                  <div className="h-16 p-4 border-b border-slate-100 flex items-center justify-center">
                    {product.stock > 0 ? (
                      <span className="text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full text-xs">In Stock ({product.stock})</span>
                    ) : (
                      <span className="text-red-500 font-medium bg-red-50 px-2.5 py-1 rounded-full text-xs">Out of Stock</span>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="h-48 p-4 border-b border-slate-100 flex items-start">
                    <p className="text-sm text-slate-600 line-clamp-6 text-wrap text-center w-full">
                      {product.description || "No description available"}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="h-24 p-4 flex items-center justify-center">
                    <Button 
                      className="w-full max-w-[200px]" 
                      disabled={product.stock <= 0}
                      onClick={() => {
                        if (!session) {
                          router.push('/login');
                          return;
                        }
                        addToCart(product);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
