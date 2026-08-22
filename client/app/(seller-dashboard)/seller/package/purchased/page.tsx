'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Crown, Frown, Loader2, ReceiptText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSellerDate, formatSellerMoney } from '@/lib/seller-orders';
import { getSellerPackagePurchases } from '@/lib/seller-packages';

export default function SellerPurchasedPackagesPage() {
  const purchasesQuery = useQuery({ queryKey: ['seller', 'package-purchases'], queryFn: getSellerPackagePurchases });

  if (purchasesQuery.isPending) return <div className="flex min-h-[50vh] items-center justify-center p-6 text-slate-500"><Loader2 className="mr-3 size-5 animate-spin" /> Loading upgrade history…</div>;
  if (purchasesQuery.isError || !purchasesQuery.data) return <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center p-6 text-center"><RefreshCw className="mb-4 size-8 text-rose-500" /><h1 className="text-xl font-black text-slate-950">History could not be loaded</h1><Button className="mt-5" onClick={() => purchasesQuery.refetch()}>Try again</Button></div>;

  const purchases = purchasesQuery.data.data;
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10"><div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-700"><ReceiptText className="size-4" /> Upgrade ledger</div><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Package purchase history</h1><p className="mt-2 text-sm text-slate-500">A permanent record of every paid shop-tier upgrade.</p></div><Button render={<Link href="/seller/package" />} className="w-full sm:w-auto">View packages</Button></header>

      {purchases.length === 0 ? <Card className="border-slate-200 bg-white shadow-sm"><CardContent className="flex flex-col items-center px-5 py-16 text-center"><div className="mb-4 rounded-full bg-slate-100 p-4"><Frown className="size-9 text-slate-400" strokeWidth={1.5} /></div><h2 className="text-lg font-black text-slate-800">No paid upgrades yet</h2><p className="mt-2 max-w-sm text-sm text-slate-500">Silver is your free starting tier. Platinum or Diamond purchases will appear here.</p><Button className="mt-6" render={<Link href="/seller/package" />}>Explore upgrades</Button></CardContent></Card> : <>
        <div className="grid gap-4 md:hidden">{purchases.map((purchase) => <Card key={purchase.id} className="overflow-hidden border-slate-200 bg-white shadow-sm"><CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-slate-950 p-4 text-white"><div><CardTitle className="text-base font-black">{purchase.packageName}</CardTitle><p className="mt-1 text-xs text-slate-400">Permanent shop upgrade</p></div><Crown className="size-6 text-cyan-300" /></CardHeader><CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 p-4 text-sm"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Price paid</p><p className="mt-1 font-black text-slate-900">{formatSellerMoney(purchase.pricePaid)}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Payment</p><p className="mt-1 font-bold text-slate-900">Wallet</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Product limit</p><p className="mt-1 font-bold text-slate-900">{purchase.productLimit.toLocaleString()}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Profit rate</p><p className="mt-1 font-bold text-emerald-700">{purchase.profitPercent}%</p></div><div className="col-span-2 border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Purchased</p><p className="mt-1 text-slate-700">{formatSellerDate(purchase.purchasedAt)}</p></div></CardContent></Card>)}</div>
        <Card className="hidden overflow-hidden border-slate-200 bg-white shadow-sm md:block"><CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5"><CardTitle className="flex items-center gap-2 text-base font-black"><Crown className="size-5 text-cyan-700" /> Paid upgrades</CardTitle></CardHeader><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4 font-bold">Package</th><th className="px-4 py-4 font-bold">Price paid</th><th className="px-4 py-4 font-bold">Product limit</th><th className="px-4 py-4 font-bold">Profit rate</th><th className="px-4 py-4 font-bold">Payment</th><th className="px-6 py-4 font-bold">Purchased</th></tr></thead><tbody className="divide-y divide-slate-100">{purchases.map((purchase) => <tr key={purchase.id} className="hover:bg-slate-50/70"><td className="px-6 py-4 font-black text-slate-900">{purchase.packageName}</td><td className="px-4 py-4 font-semibold tabular-nums">{formatSellerMoney(purchase.pricePaid)}</td><td className="px-4 py-4">{purchase.productLimit.toLocaleString()}</td><td className="px-4 py-4 font-bold text-emerald-700">{purchase.profitPercent}%</td><td className="px-4 py-4 text-slate-600">Wallet</td><td className="px-6 py-4 text-slate-600">{formatSellerDate(purchase.purchasedAt)}</td></tr>)}</tbody></table></div></Card>
      </>}
    </div></div>
  );
}
