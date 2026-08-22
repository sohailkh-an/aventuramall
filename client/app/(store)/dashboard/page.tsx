"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserDashboardPage() {
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch orders count
        const ordersRes: any = await apiClient.get("/api/orders?limit=1");
        setOrderCount(ordersRes.meta?.total || 0);

        // Fetch addresses
        const addrRes: any = await apiClient.get("/api/users/me/addresses");
        if (addrRes.data && addrRes.data.length > 0) {
          // Find default address or use first one
          const defAddr = addrRes.data.find((a: any) => a.isDefault) || addrRes.data[0];
          setDefaultAddress(defAddr);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium text-slate-800">Dashboard</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cart Card */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-pink-100 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-pink-500 opacity-90 transition-opacity group-hover:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative p-6 text-white h-32 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-1">{cartItems.length} Product{cartItems.length !== 1 ? 's' : ''}</h2>
            <p className="text-white/80 font-medium text-sm">in your cart</p>
          </div>
        </div>

        {/* Wishlist Card */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-purple-100 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-90 transition-opacity group-hover:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative p-6 text-white h-32 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-1">{wishlistItems.length} Product{wishlistItems.length !== 1 ? 's' : ''}</h2>
            <p className="text-white/80 font-medium text-sm">in your wishlist</p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-blue-100 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-sky-500 opacity-90 transition-opacity group-hover:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative p-6 text-white h-32 flex flex-col justify-center">
            {orderCount === null ? (
              <div className="h-9 w-16 bg-white/20 rounded animate-pulse mb-1" />
            ) : (
              <h2 className="text-3xl font-bold mb-1">{orderCount} Product{orderCount !== 1 ? 's' : ''}</h2>
            )}
            <p className="text-white/80 font-medium text-sm">you ordered</p>
          </div>
        </div>

      </div>

      {/* Default Shipping Address Section */}
      <Card className="border shadow-sm mt-8 rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b pb-4 pt-5">
          <CardTitle className="text-base font-medium text-slate-700">Default Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          ) : defaultAddress ? (
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-medium text-slate-800 mb-1">{defaultAddress.label}</p>
              <p>{defaultAddress.street}</p>
              <p>{defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}</p>
              <p>{defaultAddress.country}</p>
              {defaultAddress.phone && <p className="mt-2">Phone: {defaultAddress.phone}</p>}
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-4 flex items-center justify-center italic">
              No default shipping address found.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
