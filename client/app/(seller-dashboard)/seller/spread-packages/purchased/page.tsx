'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Frown, Loader2, PackageCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSellerDate, formatSellerMoney } from '@/lib/seller-orders';
import {
  getSellerSpreadPackagePurchases,
  type SellerSpreadPackagePurchase,
} from '@/lib/seller-spread-packages';
import { cn } from '@/lib/utils';

function purchaseStatus(purchase: SellerSpreadPackagePurchase) {
  if (purchase.status === 'ACTIVE') return { label: 'Current', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (purchase.status === 'REPLACED') return { label: 'Replaced', className: 'border-sky-200 bg-sky-50 text-sky-700' };
  return { label: 'Expired', className: 'border-slate-200 bg-slate-100 text-slate-600' };
}

function StatusBadge({ purchase }: { purchase: SellerSpreadPackagePurchase }) {
  const status = purchaseStatus(purchase);
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold', status.className)}>{status.label}</span>;
}

export default function SellerPurchasedSpreadPackagesPage() {
  const purchasesQuery = useQuery({
    queryKey: ['seller', 'spread-package-purchases'],
    queryFn: getSellerSpreadPackagePurchases,
  });

  if (purchasesQuery.isPending) {
    return <div className="flex min-h-[50vh] items-center justify-center p-6 text-slate-500"><Loader2 className="mr-3 size-5 animate-spin" /> Loading purchase history…</div>;
  }

  if (purchasesQuery.isError || !purchasesQuery.data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="mb-4 size-8 text-rose-500" />
        <h1 className="text-xl font-bold text-slate-950">History could not be loaded</h1>
        <Button className="mt-5" onClick={() => purchasesQuery.refetch()}>Try again</Button>
      </div>
    );
  }

  const purchases = purchasesQuery.data.data;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sky-700"><CalendarClock className="size-4" /> Package ledger</div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Spread package history</h1>
            <p className="mt-2 text-sm text-slate-500">Every wallet purchase, replacement, and expiry in one place.</p>
          </div>
          <Button render={<Link href="/seller/spread-packages" />} className="w-full sm:w-auto">Browse packages</Button>
        </header>

        {purchases.length === 0 ? (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center px-5 py-16 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4"><Frown className="size-9 text-slate-400" strokeWidth={1.5} /></div>
              <h2 className="text-lg font-bold text-slate-800">No purchases yet</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">Your first spread package will appear here with its purchase and expiry dates.</p>
              <Button className="mt-6" render={<Link href="/seller/spread-packages" />}>Choose a package</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="overflow-hidden border-slate-200 bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
                    <div className="min-w-0"><CardTitle className="truncate text-base font-black text-slate-950">{purchase.packageName}</CardTitle><p className="mt-1 text-xs text-slate-500">Wallet purchase</p></div>
                    <StatusBadge purchase={purchase} />
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 p-4 text-sm">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Price paid</p><p className="mt-1 font-bold text-slate-900">{formatSellerMoney(purchase.pricePaid)}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Spread slots</p><p className="mt-1 font-bold text-slate-900">{purchase.promotionLimit.toLocaleString()}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Purchased</p><p className="mt-1 leading-5 text-slate-700">{formatSellerDate(purchase.purchasedAt)}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Expires</p><p className="mt-1 leading-5 text-slate-700">{formatSellerDate(purchase.expiresAt)}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden overflow-hidden border-slate-200 bg-white shadow-sm md:block">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5"><CardTitle className="flex items-center gap-2 text-base font-black text-slate-900"><PackageCheck className="size-5 text-sky-700" /> All purchases</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-white text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-6 py-4 font-bold">Package</th><th className="px-4 py-4 font-bold">Price paid</th><th className="px-4 py-4 font-bold">Purchased</th><th className="px-4 py-4 font-bold">Expires</th><th className="px-4 py-4 font-bold">Payment</th><th className="px-4 py-4 font-bold">Spread slots</th><th className="px-6 py-4 text-right font-bold">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-6 py-4 font-bold text-slate-900">{purchase.packageName}</td>
                        <td className="px-4 py-4 font-semibold tabular-nums text-slate-800">{formatSellerMoney(purchase.pricePaid)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatSellerDate(purchase.purchasedAt)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatSellerDate(purchase.expiresAt)}</td>
                        <td className="px-4 py-4 text-slate-600">Wallet</td>
                        <td className="px-4 py-4 font-semibold text-slate-800">{purchase.promotionLimit.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right"><StatusBadge purchase={purchase} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
