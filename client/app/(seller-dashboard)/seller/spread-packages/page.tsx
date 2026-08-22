'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Check,
  CircleDollarSign,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatSellerMoney } from '@/lib/seller-orders';
import {
  getSellerSpreadPackages,
  purchaseSellerSpreadPackage,
  type SpreadPackage,
} from '@/lib/seller-spread-packages';
import { useSellerSession } from '@/lib/seller-auth-client';
import { cn } from '@/lib/utils';

const PACKAGE_THEMES: Record<
  string,
  { card: string; accent: string; button: string; glow: string }
> = {
  standard: {
    card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50',
    accent: 'text-sky-700',
    button: 'bg-sky-700 text-white hover:bg-sky-800',
    glow: 'bg-sky-400/15',
  },
  overseas: {
    card: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50',
    accent: 'text-orange-700',
    button: 'bg-orange-600 text-white hover:bg-orange-700',
    glow: 'bg-orange-400/15',
  },
  'off-site': {
    card: 'border-amber-200/80 bg-gradient-to-br from-yellow-50 via-white to-rose-50',
    accent: 'text-rose-600',
    button: 'bg-slate-950 text-white hover:bg-slate-800',
    glow: 'bg-amber-400/20',
  },
};

const DEFAULT_THEME = PACKAGE_THEMES.standard;

export default function SellerSpreadPackagesPage() {
  const queryClient = useQueryClient();
  const { refresh: refreshSession } = useSellerSession();
  const [selectedPackage, setSelectedPackage] = useState<SpreadPackage | null>(null);

  const packagesQuery = useQuery({
    queryKey: ['seller', 'spread-packages'],
    queryFn: getSellerSpreadPackages,
  });

  const purchaseMutation = useMutation({
    mutationFn: (packageId: string) => purchaseSellerSpreadPackage(packageId),
    onSuccess: async (response) => {
      toast.success(`${response.data.purchase.packageName} is now your current package.`);
      setSelectedPackage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seller', 'spread-packages'] }),
        queryClient.invalidateQueries({ queryKey: ['seller', 'spread-package-purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard', 'summary'] }),
        refreshSession(),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Could not purchase this package.');
    },
  });

  if (packagesQuery.isPending) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center p-6 text-slate-500">
        <Loader2 className="mr-3 size-5 animate-spin" /> Loading spread packages…
      </div>
    );
  }

  if (packagesQuery.isError || !packagesQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-rose-50 p-4 text-rose-600"><RefreshCw className="size-7" /></div>
        <h1 className="text-xl font-bold text-slate-950">Packages could not be loaded</h1>
        <p className="mt-2 text-sm text-slate-500">Check your connection and try again.</p>
        <Button className="mt-5" onClick={() => packagesQuery.refetch()}>Try again</Button>
      </div>
    );
  }

  const { packages, currentPurchase, walletBalance } = packagesQuery.data.data;
  const projectedBalance = selectedPackage ? walletBalance - selectedPackage.price : walletBalance;
  const hasEnoughFunds = !selectedPackage || projectedBalance >= 0;

  return (
    <div className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute -right-28 top-16 size-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="relative mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
              <Sparkles className="size-3.5" /> Seller reach
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Spread farther. Sell louder.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Choose one promotion package at a time. Switching packages charges the new package&apos;s full price and starts a fresh duration.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950 p-4 text-white shadow-lg shadow-slate-900/10 sm:min-w-64">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><Wallet className="size-4" /> Available wallet</div>
            <div className="mt-2 break-words text-2xl font-black tabular-nums sm:text-3xl">{formatSellerMoney(walletBalance)}</div>
            <Link href="/seller/withdraw" className="mt-2 inline-block text-xs font-semibold text-sky-300 hover:text-sky-200">Recharge wallet →</Link>
          </div>
        </header>

        {packages.length === 0 ? (
          <Card className="border-dashed py-14 text-center text-slate-500">No spread packages are available right now.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((spreadPackage) => {
              const theme = PACKAGE_THEMES[spreadPackage.code] ?? DEFAULT_THEME;
              const isCurrent = currentPurchase?.spreadPackageId === spreadPackage.id;

              return (
                <Card key={spreadPackage.id} className={cn('relative isolate overflow-hidden border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl', theme.card, isCurrent && 'ring-2 ring-emerald-500 ring-offset-2')}>
                  <div className={cn('pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-2xl', theme.glow)} />
                  <CardContent className="relative flex h-full flex-col p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={cn('text-xs font-black uppercase tracking-[0.16em]', theme.accent)}>Promotion pass</p>
                        <h2 className="mt-2 text-xl font-black text-slate-950">{spreadPackage.name}</h2>
                      </div>
                      {isCurrent ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white"><ShieldCheck className="size-3.5" /> Current</span>
                      ) : (
                        <Award className={cn('size-9 shrink-0', theme.accent)} />
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span className="text-4xl font-black tracking-tight text-slate-950">{formatSellerMoney(spreadPackage.price)}</span>
                      <span className="pb-1 text-sm font-semibold text-slate-500">for {spreadPackage.durationDays} days</span>
                    </div>

                    <div className="my-6 h-px bg-slate-900/10" />
                    <ul className="flex-1 space-y-4 text-sm text-slate-700">
                      <li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={3} /><span><strong>{spreadPackage.promotionLimit.toLocaleString()}</strong> product spread limit</span></li>
                      <li className="flex gap-3"><Clock3 className="mt-0.5 size-4 shrink-0 text-slate-500" /><span>Expires automatically after {spreadPackage.durationDays} days</span></li>
                      <li className="flex gap-3"><Star className="mt-0.5 size-4 shrink-0 text-amber-500" /><span>{spreadPackage.description}</span></li>
                    </ul>

                    <Button className={cn('mt-7 w-full font-bold', !isCurrent && theme.button)} variant={isCurrent ? 'outline' : 'default'} disabled={isCurrent || purchaseMutation.isPending} onClick={() => setSelectedPackage(spreadPackage)}>
                      {isCurrent ? 'Current package' : 'Purchase package'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedPackage)} onOpenChange={(open) => !open && !purchaseMutation.isPending && setSelectedPackage(null)}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <div className="bg-slate-950 p-5 text-white sm:p-6">
            <DialogHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-white/10"><CircleDollarSign className="size-5 text-emerald-300" /></div>
              <DialogTitle className="text-xl font-black">Confirm package purchase</DialogTitle>
              <DialogDescription className="text-slate-300">Your current package will be replaced immediately. Unused time is not refunded.</DialogDescription>
            </DialogHeader>
          </div>
          {selectedPackage && (
            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-bold text-slate-950">{selectedPackage.name}</p><p className="mt-1 text-xs text-slate-500">{selectedPackage.durationDays} days · {selectedPackage.promotionLimit.toLocaleString()} products</p></div>
                  <p className="shrink-0 font-black text-slate-950">{formatSellerMoney(selectedPackage.price)}</p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-slate-500"><dt>Wallet balance</dt><dd className="font-semibold tabular-nums text-slate-800">{formatSellerMoney(walletBalance)}</dd></div>
                <div className="flex justify-between gap-4 text-slate-500"><dt>Package charge</dt><dd className="font-semibold tabular-nums text-rose-600">− {formatSellerMoney(selectedPackage.price)}</dd></div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-bold"><dt>Remaining balance</dt><dd className={cn('tabular-nums', hasEnoughFunds ? 'text-emerald-700' : 'text-rose-600')}>{formatSellerMoney(Math.max(0, projectedBalance))}</dd></div>
              </dl>
              {!hasEnoughFunds && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  Your wallet needs {formatSellerMoney(Math.abs(projectedBalance))} more. <Link href="/seller/withdraw" className="font-bold underline underline-offset-2">Recharge now</Link>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mx-0 mb-0 px-5 sm:px-6">
            <Button variant="outline" disabled={purchaseMutation.isPending} onClick={() => setSelectedPackage(null)}>Cancel</Button>
            <Button disabled={!selectedPackage || !hasEnoughFunds || purchaseMutation.isPending} onClick={() => selectedPackage && purchaseMutation.mutate(selectedPackage.id)}>
              {purchaseMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm full-price purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
