"use client";

import React from "react";
import { useCompare } from "@/hooks/use-compare";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Product } from "@tiktokshop/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, X, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart, isInCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  if (compareItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="bg-muted p-6 rounded-full mb-6">
          <RefreshCw className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your Comparison List is Empty</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Add some products to compare their features and find the perfect one for you.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "default" }), "bg-brand hover:bg-brand/90")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shopping
        </Link>
      </div>
    );
  }

  const comparisonFields = [
    { label: "Image", key: "image" },
    { label: "Name", key: "name" },
    { label: "Price", key: "price" },
    { label: "Stock Status", key: "stock" },
    { label: "Description", key: "description" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <div className="bg-background min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compare Products</h1>
            <p className="text-muted-foreground mt-1">
              Comparing {compareItems.length} {compareItems.length === 1 ? "item" : "items"} (Max 5)
            </p>
          </div>
          <Button
            variant="outline"
            className="text-foreground border-white/10 hover:text-foreground hover:bg-dull transition-colors"
            onClick={clearCompare}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Comparison
          </Button>
        </div>

        {/* Comparison Table/Grid */}
        <div className="overflow-x-auto rounded-sm shadow-sm border border-muted/20 bg-dull">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-dull/50">
                <th className="p-6 text-left font-semibold text-brand w-1/6">Features</th>
                {compareItems.map((product) => (
                  <th key={product.id} className="p-6 text-center relative group min-w-[200px]">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center gap-4">
                      <div className="aspect-square w-32 h-32 relative overflow-hidden rounded-lg bg-muted">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-sm line-clamp-2">{product.name}</span>
                    </div>
                  </th>
                ))}
                {/* Empty slots if less than 5 */}
                {Array.from({ length: Math.max(0, 5 - compareItems.length) }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-6 text-center text-muted-foreground/30 min-w-[200px]">
                    <div className="aspect-square w-32 h-32 mx-auto border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price Row */}
              <tr className="border-b border-white/10 hover:bg-muted/10 transition-colors">
                <td className="p-6 font-medium text-muted-foreground">Price</td>
                {compareItems.map((product) => (
                  <td key={product.id} className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-brand">
                        {formatPrice(Number(product.price))}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(Number(product.compareAtPrice))}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
                {Array.from({ length: 5 - compareItems.length }).map((_, i) => (
                  <td key={`empty-price-${i}`} className="p-6"></td>
                ))}
              </tr>

              {/* Stock Status Row */}
              <tr className="border-b border-white/10 hover:bg-muted/10 transition-colors">
                <td className="p-6 font-medium text-muted-foreground">Availability</td>
                {compareItems.map((product) => (
                  <td key={product.id} className="p-6 text-center">
                    {product.stock > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        In Stock ({product.stock})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Out of Stock
                      </Badge>
                    )}
                  </td>
                ))}
                {Array.from({ length: 5 - compareItems.length }).map((_, i) => (
                  <td key={`empty-stock-${i}`} className="p-6"></td>
                ))}
              </tr>

              {/* Description Row */}
              <tr className="border-b border-white/10 hover:bg-muted/10 transition-colors">
                <td className="p-6 font-medium text-muted-foreground align-top">Description</td>
                {compareItems.map((product) => (
                  <td key={product.id} className="p-6 text-sm text-muted-foreground leading-relaxed align-top">
                    <div className="line-clamp-6" title={product.description || ""}>
                      {product.description || "No description available."}
                    </div>
                  </td>
                ))}
                {Array.from({ length: 5 - compareItems.length }).map((_, i) => (
                  <td key={`empty-desc-${i}`} className="p-6"></td>
                ))}
              </tr>

              {/* Actions Row */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-6 font-medium text-muted-foreground">Action</td>
                {compareItems.map((product) => (
                  <td key={product.id} className="p-6 text-center">
                    <div className="flex flex-col gap-3">
                      <Link
                        href={`/products/${product.slug}`}
                        className={cn(buttonVariants({ variant: "default" }), "bg-brand hover:bg-brand/30 w-full")}
                      >
                        View Details
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("w-full", isInCart(product.id) && "bg-brand/10 border-brand text-brand")}
                        onClick={() => {
                          if (!session) {
                            router.push('/login');
                            return;
                          }
                          addToCart(product);
                        }}
                        disabled={product.stock <= 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.stock <= 0
                          ? "Out of Stock"
                          : isInCart(product.id)
                            ? "In Cart"
                            : "Add to Cart"}
                      </Button>
                    </div>
                  </td>
                ))}
                {Array.from({ length: 5 - compareItems.length }).map((_, i) => (
                  <td key={`empty-actions-${i}`} className="p-6"></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile View Disclaimer */}
        <div className="mt-4 md:hidden flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Scroll horizontally to see more products</span>
          <div className="w-4 h-4 animate-bounce-x">→</div>
        </div>
      </div>
    </div>
  );
}
