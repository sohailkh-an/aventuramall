'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Package,
  PackageCheck,
  Plus,
  Settings,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { useSellerSession } from '@/lib/seller-auth-client';
import { formatSellerMoney, sellerApiGet, SellerDashboardSummary } from '@/lib/seller-orders';
import { cn } from '@/lib/utils';

type Accent = 'cyan' | 'rose' | 'emerald' | 'amber';

const accentClasses: Record<Accent, string> = {
  cyan: 'from-cyan-500 via-sky-500 to-blue-600',
  rose: 'from-rose-500 via-pink-500 to-fuchsia-600',
  emerald: 'from-emerald-500 via-teal-500 to-cyan-600',
  amber: 'from-amber-400 via-orange-500 to-rose-500',
};

export default function SellerDashboardPage() {
  const { data: session } = useSellerSession();
  const seller = session?.seller;
  const sellerPackage = seller?.sellerPackage;
  const isVerified = seller?.status === 'APPROVED';

  const summaryQuery = useQuery({
    queryKey: ['seller', 'dashboard', 'summary'],
    enabled: Boolean(seller),
    staleTime: 30_000,
    queryFn: () => sellerApiGet<{ data: SellerDashboardSummary }>('/api/seller/dashboard/summary'),
  });

  const summary = summaryQuery.data?.data;
  const maxChartSales = Math.max(...(summary?.chart.map((point) => point.sales) || [0]), 1);

  if (summaryQuery.isPending) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5 p-3 sm:p-4 md:space-y-6 md:p-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">Seller Command Center</p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              {seller?.shopName || 'Seller Dashboard'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Live inventory, order movement, and sales health for your shop.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
            <Link href="/seller/settings" className={cn(buttonVariants({ variant: 'outline' }), 'bg-white')}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Shop
            </Link>
            <Link href="/seller/storehouse" className={cn(buttonVariants(), 'bg-slate-950 text-white hover:bg-slate-800')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </div>
        </div>
      </section>

      {summaryQuery.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {summaryQuery.error instanceof Error ? summaryQuery.error.message : 'Failed to load dashboard summary'}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <MetricCard
          label="Products"
          value={(summary?.products.total || 0).toLocaleString()}
          detail={`${summary?.products.active || 0} active, ${summary?.products.hidden || 0} hidden`}
          icon={Package}
          accent="cyan"
        />
        <MetricCard
          label="Orders"
          value={(summary?.orders.totalOrders || 0).toLocaleString()}
          detail={`${summary?.orders.newOrders || 0} awaiting action`}
          icon={ClipboardList}
          accent="rose"
        />
        <MetricCard
          label="Total Sales"
          value={formatSellerMoney(summary?.orders.totalTurnover)}
          detail={`${formatSellerMoney(summary?.sales.today)} today`}
          icon={TrendingUp}
          accent="emerald"
        />
        <MetricCard
          label="Est. Profit"
          value={formatSellerMoney(summary?.sales.estimatedProfit)}
          detail={`${summary?.sales.profitPercent || 0}% package rate`}
          icon={Wallet}
          accent="amber"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <CardTitle className="text-base font-black text-slate-950">7-Day Sales</CardTitle>
                <p className="text-sm text-slate-500">Revenue from orders containing your seller products.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {formatSellerMoney(summary?.sales.thisMonth)} this month
              </span>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid h-[260px] grid-cols-7 items-end gap-2 sm:gap-3">
                {(summary?.chart || []).map((point) => (
                  <div key={point.date} className="flex h-full min-w-0 flex-col justify-end gap-2">
                    <div className="flex flex-1 items-end rounded-lg bg-slate-50 p-1">
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-cyan-500 to-emerald-400 shadow-sm transition-all"
                        style={{ height: `${Math.max((point.sales / maxChartSales) * 100, point.sales > 0 ? 8 : 3)}%` }}
                        title={`${point.label}: ${formatSellerMoney(point.sales)}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="truncate text-[11px] font-bold text-slate-500">{point.label}</p>
                      <p className="text-[10px] text-slate-400">{point.orders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MiniStat label="Today Sales" value={formatSellerMoney(summary?.sales.today)} compare={`Yesterday ${formatSellerMoney(summary?.sales.yesterday)}`} />
            <MiniStat label="Month Sales" value={formatSellerMoney(summary?.sales.thisMonth)} compare={`Last month ${formatSellerMoney(summary?.sales.lastMonth)}`} />
            <MiniStat label="Inventory Value" value={formatSellerMoney(summary?.products.inventoryValue)} compare={`${summary?.products.remainingSlots || 0} upload slots left`} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickAction href="/seller/withdraw" icon={CreditCard} label="Money Withdraw" />
            <QuickAction href="/seller/storehouse" icon={PackageCheck} label="Product Storehouse" />
            <QuickAction href="/seller/orders" icon={ShoppingBag} label="View Orders" />
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 p-5">
              <CardTitle className="text-base font-black text-slate-950">Order Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <OrderFlowItem icon={ShoppingBag} label="New Orders" value={summary?.orders.newOrders || 0} tone="blue" />
              <OrderFlowItem icon={Truck} label="On Delivery" value={summary?.orders.onDeliveryOrders || 0} tone="amber" />
              <OrderFlowItem icon={CheckCircle2} label="Delivered" value={summary?.orders.deliveredOrders || 0} tone="emerald" />
              <OrderFlowItem icon={XCircle} label="Cancelled" value={summary?.orders.cancelledOrders || 0} tone="rose" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                  <Award className="h-7 w-7" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current Package</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{sellerPackage?.name || 'Silver'} Shop</h3>
                  <p className="text-sm text-slate-500">{(summary?.products.packageLimit || 0).toLocaleString()} product limit</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">Package usage</span>
                  <span className="font-black text-slate-900">{summary?.products.usagePercent || 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${summary?.products.usagePercent || 0}%` }}
                  />
                </div>
              </div>

              <Link
                href="/seller/package"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'mt-5 w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50'
                )}
              >
                Upgrade Package
              </Link>
            </CardContent>
          </Card>

          <Card className={cn('border shadow-sm', isVerified ? 'border-emerald-100 bg-emerald-50/70' : 'border-rose-100 bg-rose-50/70')}>
            <CardContent className="flex items-center gap-4 p-5">
              {isVerified ? (
                <CheckCircle2 className="h-11 w-11 flex-shrink-0 text-emerald-600" strokeWidth={1.6} />
              ) : (
                <ShieldAlert className="h-11 w-11 flex-shrink-0 text-rose-500" strokeWidth={1.6} />
              )}
              <div className="min-w-0">
                <h3 className={cn('font-black', isVerified ? 'text-emerald-800' : 'text-rose-800')}>
                  {isVerified ? 'Verified Shop' : 'Verification Needed'}
                </h3>
                <p className={cn('text-sm', isVerified ? 'text-emerald-700/80' : 'text-rose-700/80')}>
                  {isVerified ? 'Your shop is cleared for seller features.' : 'Verify your identity to unlock all seller features.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  accent: Accent;
}) {
  return (
    <Card className={cn('overflow-hidden border-none bg-gradient-to-br text-white shadow-sm', accentClasses[accent])}>
      <CardContent className="flex min-h-36 items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/80">{label}</p>
          <h2 className="mt-2 break-words text-3xl font-black tracking-tight">{value}</h2>
          <p className="mt-3 text-sm font-medium text-white/75">{detail}</p>
        </div>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/18 text-white">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, compare }: { label: string; value: string; compare: string }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">{value}</h3>
        <p className="mt-3 text-xs font-medium text-slate-400">{compare}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-24 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-cyan-600">
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </Link>
  );
}

function OrderFlowItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: 'blue' | 'amber' | 'emerald' | 'rose';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="truncate text-sm font-semibold text-slate-600">{label}</p>
      </div>
      <p className="text-xl font-black text-slate-950">{value.toLocaleString()}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 p-3 sm:p-4 md:space-y-6 md:p-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SkeletonBlock className="h-4 w-44" />
        <SkeletonBlock className="mt-3 h-8 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SkeletonBlock className="h-[360px] rounded-xl" />
        <div className="space-y-5">
          <SkeletonBlock className="h-64 rounded-xl" />
          <SkeletonBlock className="h-44 rounded-xl" />
        </div>
      </div>
      <style jsx global>{`
        @keyframes seller-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('seller-shimmer relative overflow-hidden rounded-lg bg-slate-100', className)}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent [animation:seller-shimmer_1.35s_infinite]" />
    </div>
  );
}
