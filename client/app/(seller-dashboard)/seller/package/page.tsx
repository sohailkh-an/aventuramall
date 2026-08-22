'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Crown, Gem, Loader2, Medal, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSellerSession } from '@/lib/seller-auth-client';
import { formatSellerMoney } from '@/lib/seller-orders';
import { getSellerPackages, purchaseSellerPackage, type SellerPackage } from '@/lib/seller-packages';
import { cn } from '@/lib/utils';

const TIER_STYLES: Record<string, { shell: string; accent: string; button: string; orb: string; icon: typeof Medal }> = {
  silver: { shell: 'border-slate-300 bg-gradient-to-br from-slate-100 via-white to-slate-200', accent: 'text-slate-600', button: 'bg-slate-800 text-white hover:bg-slate-950', orb: 'bg-slate-400/25', icon: Medal },
  platinum: { shell: 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-100', accent: 'text-cyan-700', button: 'bg-cyan-700 text-white hover:bg-cyan-800', orb: 'bg-cyan-400/25', icon: Crown },
  diamond: { shell: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-100', accent: 'text-rose-600', button: 'bg-slate-950 text-white hover:bg-slate-800', orb: 'bg-amber-400/30', icon: Gem },
};

const DEFAULT_STYLE = TIER_STYLES.silver;

export default function SellerPackagesPage() {
  const queryClient = useQueryClient();
  const { refresh: refreshSession } = useSellerSession();
  const [selectedPackage, setSelectedPackage] = useState<SellerPackage | null>(null);
  const packagesQuery = useQuery({ queryKey: ['seller', 'packages'], queryFn: getSellerPackages });
  const purchaseMutation = useMutation({
    mutationFn: purchaseSellerPackage,
    onSuccess: async (response) => {
      toast.success(`Welcome to ${response.data.currentPackage.name}. Your upgrade is permanent.`);
      setSelectedPackage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seller', 'packages'] }),
        queryClient.invalidateQueries({ queryKey: ['seller', 'package-purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard', 'summary'] }),
        refreshSession(),
      ]);
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Package upgrade failed.'),
  });

  if (packagesQuery.isPending) return <div className="flex min-h-[55vh] items-center justify-center p-6 text-slate-500"><Loader2 className="mr-3 size-5 animate-spin" /> Loading seller packages…</div>;
  if (packagesQuery.isError || !packagesQuery.data) return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center p-6 text-center"><RefreshCw className="mb-4 size-8 text-rose-500" /><h1 className="text-xl font-black text-slate-950">Packages could not be loaded</h1><p className="mt-2 text-sm text-slate-500">Check your connection and try again.</p><Button className="mt-5" onClick={() => packagesQuery.refetch()}>Try again</Button></div>
  );

  const { packages, currentPackage, walletBalance } = packagesQuery.data.data;
  const projectedBalance = selectedPackage ? walletBalance - selectedPackage.price : walletBalance;
  const hasEnoughFunds = projectedBalance >= 0;

  return (
    <div className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute -left-24 top-28 size-72 rounded-full bg-cyan-200/25 blur-3xl" />
      <div className="relative mx-auto max-w-6xl space-y-7">
        <header className="overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-300"><Sparkles className="size-3.5" /> Seller status</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Build a shop that grows with you.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Every upgrade is permanent. Unlock more product capacity and a stronger profit rate with one wallet payment.</p></div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current tier</p><p className="mt-2 truncate text-lg font-black">{currentPackage?.name ?? 'No package'}</p></div>
              <div className="rounded-2xl bg-white p-4 text-slate-950"><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500"><Wallet className="size-3.5" /> Wallet</p><p className="mt-2 break-words text-lg font-black tabular-nums">{formatSellerMoney(walletBalance)}</p><Link href="/seller/withdraw" className="mt-1 inline-block text-xs font-bold text-cyan-700">Recharge →</Link></div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((sellerPackage) => {
            const style = TIER_STYLES[sellerPackage.code] ?? DEFAULT_STYLE;
            const TierIcon = style.icon;
            const isCurrent = currentPackage?.id === sellerPackage.id;
            const isSurpassed = Boolean(currentPackage && sellerPackage.sortOrder < currentPackage.sortOrder);
            const canUpgrade = Boolean(currentPackage && sellerPackage.sortOrder > currentPackage.sortOrder && sellerPackage.price > 0);
            return (
              <Card key={sellerPackage.id} className={cn('relative isolate overflow-hidden border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl', style.shell, isCurrent && 'ring-2 ring-emerald-500 ring-offset-2')}>
                <div className={cn('pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-2xl', style.orb)} />
                <CardContent className="relative flex h-full flex-col p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-3"><div><p className={cn('text-xs font-black uppercase tracking-[0.18em]', style.accent)}>Permanent tier</p><h2 className="mt-2 text-2xl font-black text-slate-950">{sellerPackage.name}</h2></div>{isCurrent ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white"><ShieldCheck className="size-3.5" /> Current</span> : <TierIcon className={cn('size-10 shrink-0', style.accent)} />}</div>
                  <div className="mt-6 flex items-end gap-2"><span className="text-4xl font-black tracking-tight text-slate-950">{sellerPackage.price === 0 ? 'Free' : formatSellerMoney(sellerPackage.price)}</span>{sellerPackage.price > 0 && <span className="pb-1 text-xs font-bold uppercase tracking-wide text-slate-500">one time</span>}</div>
                  <div className="my-6 h-px bg-slate-900/10" />
                  <ul className="flex-1 space-y-4 text-sm text-slate-700"><li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={3} /><span><strong>{sellerPackage.productLimit.toLocaleString()}</strong> product upload limit</span></li><li className="flex gap-3"><TrendingUp className="mt-0.5 size-4 shrink-0 text-cyan-700" /><span>Up to <strong>{sellerPackage.profitPercent}%</strong> profit rate</span></li><li className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-500" /><span>Permanent until your next upgrade</span></li></ul>
                  <Button className={cn('mt-7 min-h-11 w-full font-bold', canUpgrade && style.button)} variant={canUpgrade ? 'default' : 'outline'} disabled={!canUpgrade || purchaseMutation.isPending} onClick={() => canUpgrade && setSelectedPackage(sellerPackage)}>{isCurrent ? 'Current package' : isSurpassed ? 'Already surpassed' : sellerPackage.price === 0 ? 'Free default tier' : 'Upgrade package'}</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={Boolean(selectedPackage)} onOpenChange={(open) => !open && !purchaseMutation.isPending && setSelectedPackage(null)}>
        <DialogContent className="max-w-md overflow-hidden p-0"><div className="bg-slate-950 p-5 text-white sm:p-6"><DialogHeader><div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-cyan-400/15"><TrendingUp className="size-5 text-cyan-300" /></div><DialogTitle className="text-xl font-black">Confirm permanent upgrade</DialogTitle><DialogDescription className="text-slate-300">This charges the destination tier&apos;s full price. Package upgrades cannot be reversed by the seller.</DialogDescription></DialogHeader></div>
          {selectedPackage && <div className="space-y-4 p-5 sm:p-6"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-black text-slate-950">{currentPackage?.name} → {selectedPackage.name}</p><p className="mt-1 text-xs text-slate-500">{selectedPackage.productLimit.toLocaleString()} products · {selectedPackage.profitPercent}% profit</p></div><p className="shrink-0 font-black">{formatSellerMoney(selectedPackage.price)}</p></div></div><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4 text-slate-500"><dt>Wallet balance</dt><dd className="font-semibold tabular-nums text-slate-800">{formatSellerMoney(walletBalance)}</dd></div><div className="flex justify-between gap-4 text-slate-500"><dt>Full upgrade charge</dt><dd className="font-semibold tabular-nums text-rose-600">− {formatSellerMoney(selectedPackage.price)}</dd></div><div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-bold"><dt>Remaining balance</dt><dd className={cn('tabular-nums', hasEnoughFunds ? 'text-emerald-700' : 'text-rose-600')}>{formatSellerMoney(Math.max(0, projectedBalance))}</dd></div></dl>{!hasEnoughFunds && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">You need {formatSellerMoney(Math.abs(projectedBalance))} more. <Link href="/seller/withdraw" className="font-bold underline underline-offset-2">Recharge now</Link></div>}</div>}
          <DialogFooter className="mx-0 mb-0 px-5 sm:px-6"><Button variant="outline" disabled={purchaseMutation.isPending} onClick={() => setSelectedPackage(null)}>Cancel</Button><Button disabled={!selectedPackage || !hasEnoughFunds || purchaseMutation.isPending} onClick={() => selectedPackage && purchaseMutation.mutate(selectedPackage.id)}>{purchaseMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Confirm full-price upgrade</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
