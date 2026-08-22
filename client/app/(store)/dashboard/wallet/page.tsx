"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Frown, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/use-currency";

export default function WalletPage() {
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [isLoading, setIsLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res: any = await apiClient.get("/api/users/me");
        setWalletBalance(res.data.walletBalance || "0.00");
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-normal text-slate-800">My Wallet</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Wallet Balance Card */}
        <div className="bg-[#D34690] text-white rounded-md flex flex-col items-center justify-center p-6 shadow-sm min-h-[140px]">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <span className="font-bold text-xs leading-none">FX</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formatPrice(Number(walletBalance))}</div>
          <div className="text-sm opacity-90 font-medium">Wallet Balance</div>
        </div>

        {/* Recharge Wallet */}
        <div className="bg-white rounded-md flex flex-col items-center justify-center p-6 shadow-sm border border-slate-100 min-h-[140px] cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-slate-400 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-[#E64A19] font-medium">Recharge Wallet</div>
        </div>

        {/* Offline Recharge Wallet */}
        <div className="bg-white rounded-md flex flex-col items-center justify-center p-6 shadow-sm border border-slate-100 min-h-[140px] cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-slate-400 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-[#E64A19] font-medium">Offline Recharge Wallet</div>
        </div>

        {/* Send Withdraw Request */}
        <div className="bg-[#6B52AD] text-white rounded-md flex flex-col items-center justify-center p-6 shadow-sm min-h-[140px] cursor-pointer hover:opacity-95 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="font-medium">Send Withdraw Request</div>
        </div>
      </div>

      {/* Wallet Recharge History */}
      <Card className="rounded-md border-slate-100 shadow-sm overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] text-slate-700 font-medium">Wallet Recharge History</h2>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-bold border-b border-slate-100 bg-white">
                <tr>
                  <th className="py-4 px-6 text-slate-700">#</th>
                  <th className="py-4 px-6 text-slate-700">Date</th>
                  <th className="py-4 px-6 text-slate-700">Amount</th>
                  <th className="py-4 px-6 text-slate-700">Payment method</th>
                  <th className="py-4 px-6 text-slate-700 text-right">Approval</th>
                </tr>
              </thead>
            </table>
            
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Frown className="w-12 h-12 mb-4 text-slate-400 stroke-1" />
              <p className="text-lg text-slate-600">Nothing found</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Request history */}
      <Card className="rounded-md border-slate-100 shadow-sm overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] text-slate-700 font-medium">Withdraw Request history</h2>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-bold border-b border-slate-100 bg-white">
                <tr>
                  <th className="py-4 px-6 text-slate-700">#</th>
                  <th className="py-4 px-6 text-slate-700">Date</th>
                  <th className="py-4 px-6 text-slate-700">Amount</th>
                  <th className="py-4 px-6 text-slate-700">Type</th>
                  <th className="py-4 px-6 text-slate-700">Status</th>
                  <th className="py-4 px-6 text-slate-700">Withdraw Type</th>
                  <th className="py-4 px-6 text-slate-700">Remarks</th>
                  <th className="py-4 px-6 text-slate-700">Message</th>
                </tr>
              </thead>
            </table>
            
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Frown className="w-12 h-12 mb-4 text-slate-400 stroke-1" />
              <p className="text-lg text-slate-600">Nothing found</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
