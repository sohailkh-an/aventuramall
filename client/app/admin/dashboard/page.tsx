'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  LifeBuoy,
  PackageCheck,
  RefreshCcw,
  ShieldAlert,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Accent = 'cyan' | 'rose' | 'emerald' | 'amber';

type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'PICKED_UP'
  | 'SHIPPED'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

interface AdminSalesOrder {
  id: string;
  code: string;
  status: OrderStatus;
  deliveryStatus: OrderStatus;
  paymentStatus: 'PAID' | 'UNPAID';
  amount: number;
  productCount: number;
  date: string;
  shop: string;
  customer: {
    name: string;
    email: string;
  };
}

interface OrdersResponse {
  data: AdminSalesOrder[];
  meta: {
    total: number;
  };
}

interface Customer {
  id: string;
  walletBalance: number | string;
  isBanned?: boolean;
}

interface Seller {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  allowWithdraw?: boolean;
  _count?: {
    products?: number;
  };
}

interface PaymentMethod {
  id: string;
  isActive: boolean;
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const accentClasses: Record<Accent, string> = {
  cyan: 'from-[#67e8f9] via-[#7dd3fc] to-[#93c5fd]',
  rose: 'from-[#f9a8d4] via-[#fda4af] to-[#fdba74]',
  emerald: 'from-[#86efac] via-[#5eead4] to-[#67e8f9]',
  amber: 'from-[#fde047] via-[#fb923c] to-[#fb7185]',
};

function formatMoney(value: number | undefined) {
  return money.format(value || 0);
}

function buildQuery(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (String(value).trim()) searchParams.set(key, String(value));
  });
  return `?${searchParams.toString()}`;
}

export default function AdminPage() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'orders'],
    queryFn: () =>
      apiClient.get<OrdersResponse>(
        `/api/admin/sales/orders${buildQuery({ page: 1, limit: 100, status: 'ALL' })}`
      ),
  });

  const customersQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'customers'],
    queryFn: () => apiClient.get<{ data: Customer[] }>('/api/admin/customers'),
  });

  const sellersQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'sellers'],
    queryFn: () => apiClient.get<{ data: Seller[] }>('/api/admin/sellers'),
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'payment-methods'],
    queryFn: () => apiClient.get<{ data: PaymentMethod[] }>('/api/admin/payment-methods'),
  });

  const orders = useMemo(() => ordersQuery.data?.data || [], [ordersQuery.data?.data]);
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data?.data]);
  const sellers = useMemo(() => sellersQuery.data?.data || [], [sellersQuery.data?.data]);
  const paymentMethods = useMemo(
    () => paymentMethodsQuery.data?.data || [],
    [paymentMethodsQuery.data?.data]
  );

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const productsSold = orders.reduce((sum, order) => sum + Number(order.productCount || 0), 0);
    const pendingOrders = orders.filter((order) =>
      ['PENDING', 'PROCESSING', 'CONFIRMED'].includes(order.deliveryStatus)
    ).length;
    const deliveredOrders = orders.filter((order) => order.deliveryStatus === 'DELIVERED').length;
    const cancelledOrders = orders.filter((order) => order.deliveryStatus === 'CANCELLED').length;
    const activeCustomers = customers.filter((customer) => !customer.isBanned).length;
    const walletBalance = customers.reduce(
      (sum, customer) => sum + Number(customer.walletBalance || 0),
      0
    );
    const approvedSellers = sellers.filter((seller) => seller.status === 'APPROVED').length;
    const pendingSellers = sellers.filter((seller) => seller.status === 'PENDING').length;
    const sellerProducts = sellers.reduce(
      (sum, seller) => sum + Number(seller._count?.products || 0),
      0
    );
    const activePaymentMethods = paymentMethods.filter((method) => method.isActive).length;

    return {
      revenue,
      productsSold,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      activeCustomers,
      walletBalance,
      approvedSellers,
      pendingSellers,
      sellerProducts,
      activePaymentMethods,
    };
  }, [orders, customers, sellers, paymentMethods]);

  const recentOrders = orders.slice(0, 5);
  const isLoading =
    ordersQuery.isPending || customersQuery.isPending || sellersQuery.isPending || paymentMethodsQuery.isPending;
  const hasError =
    ordersQuery.isError || customersQuery.isError || sellersQuery.isError || paymentMethodsQuery.isError;

  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5 text-slate-950 md:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
              Marketplace Command Center
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Sales movement, seller health, customer wallets, and payment readiness in one operational view.
            </p>
          </div>

          <Button
            variant="outline"
            className="h-11 justify-center border-slate-200 bg-white"
            onClick={refreshDashboard}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </section>

      {hasError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Some dashboard data could not be loaded. The available cards are still shown from successful requests.
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <MetricCard
          label="Sales Volume"
          value={formatMoney(stats.revenue)}
          detail={`${(ordersQuery.data?.meta.total || 0).toLocaleString()} total orders tracked`}
          icon={TrendingUp}
          accent="cyan"
        />
        <MetricCard
          label="Active Customers"
          value={stats.activeCustomers.toLocaleString()}
          detail={`${formatMoney(stats.walletBalance)} wallet balance`}
          icon={Users}
          accent="rose"
        />
        <MetricCard
          label="Approved Sellers"
          value={stats.approvedSellers.toLocaleString()}
          detail={`${stats.pendingSellers.toLocaleString()} waiting for review`}
          icon={Store}
          accent="emerald"
        />
        <MetricCard
          label="Catalog Movement"
          value={stats.productsSold.toLocaleString()}
          detail={`${stats.sellerProducts.toLocaleString()} seller products live`}
          icon={ShoppingBag}
          accent="amber"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <CardTitle className="text-base font-black text-slate-950">Recent Order Pulse</CardTitle>
                <p className="text-sm text-slate-500">Latest marketplace orders from checkout and admin POS.</p>
              </div>
              <Link
                href="/admin/sales"
                className="inline-flex w-fit items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
              >
                View orders
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">{order.code}</p>
                          <StatusPill status={order.deliveryStatus} />
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {order.customer.name} • {order.shop}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-black text-slate-950">{formatMoney(order.amount)}</p>
                        <p className="text-xs font-semibold text-slate-400">{order.productCount} products</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm font-medium text-slate-500">No recent orders found yet.</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MiniStat
              label="Payment Rails"
              value={stats.activePaymentMethods.toLocaleString()}
              compare={`${paymentMethods.length.toLocaleString()} configured methods`}
            />
            <MiniStat
              label="Pending Orders"
              value={stats.pendingOrders.toLocaleString()}
              compare={`${stats.deliveredOrders.toLocaleString()} delivered recently`}
            />
            <MiniStat
              label="Cancelled Orders"
              value={stats.cancelledOrders.toLocaleString()}
              compare="Watch this for support follow-up"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickAction href="/admin/pos" icon={PackageCheck} label="Create POS Order" />
            <QuickAction href="/admin/sellers/list" icon={ShieldAlert} label="Review Sellers" />
            <QuickAction href="/admin/payment" icon={CreditCard} label="Payment Setup" />
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 p-5">
              <CardTitle className="text-base font-black text-slate-950">Operations Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <FlowItem icon={ShoppingBag} label="Pending orders" value={stats.pendingOrders} tone="blue" />
              <FlowItem icon={CheckCircle2} label="Delivered orders" value={stats.deliveredOrders} tone="emerald" />
              <FlowItem icon={XCircle} label="Cancelled orders" value={stats.cancelledOrders} tone="rose" />
              <FlowItem icon={ShieldAlert} label="Seller reviews" value={stats.pendingSellers} tone="amber" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                  <Banknote className="h-7 w-7" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Cash Desk</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{formatMoney(stats.walletBalance)}</h3>
                  <p className="text-sm text-slate-500">Customer wallet funds currently in the marketplace.</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <Wallet className="mb-2 h-5 w-5 text-emerald-600" />
                  <p className="text-xl font-black text-slate-950">{stats.activeCustomers}</p>
                  <p className="text-xs font-semibold text-slate-500">Active buyers</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <LifeBuoy className="mb-2 h-5 w-5 text-rose-600" />
                  <p className="text-xl font-black text-slate-950">{stats.pendingSellers}</p>
                  <p className="text-xs font-semibold text-slate-500">Reviews due</p>
                </div>
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
    <Card className={cn('overflow-hidden border-none bg-gradient-to-br text-slate-950 shadow-sm', accentClasses[accent])}>
      <CardContent className="flex min-h-36 items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800/80">{label}</p>
          <h2 className="mt-2 break-words text-3xl font-black tracking-tight">{value}</h2>
          <p className="mt-3 text-sm font-medium text-slate-800/75">{detail}</p>
        </div>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/45 text-slate-900 shadow-sm ring-1 ring-white/55">
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

function FlowItem({
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

function StatusPill({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    PROCESSING: 'bg-blue-50 text-blue-700',
    CONFIRMED: 'bg-cyan-50 text-cyan-700',
    PICKED_UP: 'bg-indigo-50 text-indigo-700',
    SHIPPED: 'bg-purple-50 text-purple-700',
    ON_THE_WAY: 'bg-sky-50 text-sky-700',
    DELIVERED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-rose-50 text-rose-700',
  };

  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide', styles[status])}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 p-3 sm:p-4 md:space-y-6 md:p-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SkeletonBlock className="h-4 w-56" />
        <SkeletonBlock className="mt-3 h-8 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SkeletonBlock className="h-[360px] rounded-xl" />
        <div className="space-y-5">
          <SkeletonBlock className="h-64 rounded-xl" />
          <SkeletonBlock className="h-44 rounded-xl" />
        </div>
      </div>
      <style jsx global>{`
        @keyframes admin-shimmer {
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
    <div className={cn('relative overflow-hidden rounded-lg bg-slate-100', className)}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent [animation:admin-shimmer_1.35s_infinite]" />
    </div>
  );
}
