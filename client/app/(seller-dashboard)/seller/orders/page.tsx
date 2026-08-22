'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowUpCircle, Eye, Frown, PackageCheck, RefreshCcw, Search } from 'lucide-react';
import {
  formatSellerDate,
  formatSellerMoney,
  sellerApiGet,
  SellerOrder,
  SellerOrdersResponse,
  SellerOrdersSummary,
} from '@/lib/seller-orders';
import { cn } from '@/lib/utils';

type SellerOrderStatus = 'ALL' | SellerOrder['status'];

const statusOptions: Array<{ value: SellerOrderStatus; label: string }> = [
  { value: 'ALL', label: 'All delivery statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PICKED_UP', label: 'Picked up' },
  { value: 'ON_THE_WAY', label: 'On the way' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancel' },
];

function buildQuery(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (String(value).trim()) searchParams.set(key, String(value));
  });
  return `?${searchParams.toString()}`;
}

export default function SellerOrdersPage() {
  const [status, setStatus] = useState<SellerOrderStatus>('ALL');
  const [search, setSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ status: 'ALL', q: '' });

  const summaryQuery = useQuery({
    queryKey: ['seller', 'orders', 'summary'],
    queryFn: () => sellerApiGet<{ data: SellerOrdersSummary }>('/api/seller/orders/summary'),
  });

  const ordersQuery = useQuery({
    queryKey: ['seller', 'orders', appliedFilters],
    queryFn: () =>
      sellerApiGet<SellerOrdersResponse>(
        `/api/seller/orders${buildQuery({
          page: 1,
          limit: 100,
          status: appliedFilters.status,
          q: appliedFilters.q,
        })}`
      ),
  });

  const orders = useMemo(() => ordersQuery.data?.data || [], [ordersQuery.data?.data]);
  const summary = summaryQuery.data?.data;

  console.log('Orders:', orders);

  const applyFilters = () => {
    setAppliedFilters({ status, q: search.trim() });
  };

  const resetFilters = () => {
    setStatus('ALL');
    setSearch('');
    setAppliedFilters({ status: 'ALL', q: '' });
  };

  return (
    <div className="space-y-5 p-3 sm:p-4 md:space-y-6 md:p-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <MetricCard label="Total orders" value={summary?.totalOrders || 0} />
        <MetricCard label="Total Turnover" value={formatSellerMoney(summary?.totalTurnover)} />
        <MetricCard label="Total Profit" value={formatSellerMoney(summary?.totalProfit)} />
      </div>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-4 sm:p-6 border-b border-slate-100 gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800 min-w-max">Orders</h2>
            <p className="text-sm text-slate-500">
              Orders containing products from your seller listings.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 sm:grid sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto_auto] xl:w-auto xl:items-center xl:justify-end">
            <Select
              value={status}
              onValueChange={(value) => setStatus((value || 'ALL') as SellerOrderStatus)}
            >
              <SelectTrigger className="w-full sm:w-[220px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters();
                }}
                placeholder="Type order code or customer"
                className="bg-white pl-9"
              />
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700" onClick={applyFilters}>
              Filter
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {ordersQuery.isLoading ? (
            <div className="rounded-xl bg-slate-50 px-6 py-12 text-center text-slate-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-6 py-12 text-center text-slate-500">
              <Frown className="mx-auto mb-4 h-12 w-12 text-slate-400" strokeWidth={1.5} />
              <p className="text-lg font-medium text-slate-600">Nothing found</p>
            </div>
          ) : (
            orders.map((order) => <OrderMobileCard key={order.id} order={order} />)
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1220px] text-sm text-left">
            <thead className="text-xs text-slate-800 bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold min-w-[150px]">Order ID</th>
                <th className="px-6 py-4 font-bold min-w-[190px]">Customer</th>
                <th className="px-6 py-4 font-bold min-w-[160px]">Date</th>
                <th className="px-6 py-4 font-bold min-w-[110px]">Products</th>
                <th className="px-6 py-4 font-bold min-w-[130px]">Amount</th>
                <th className="px-6 py-4 font-bold min-w-[130px]">Profit</th>
                <th className="px-6 py-4 font-bold min-w-[140px]">Payment Status</th>
                <th className="px-6 py-4 font-bold min-w-[150px]">Delivery Status</th>
                <th className="px-6 py-4 font-bold min-w-[220px]">Items</th>
                <th className="px-6 py-4 font-bold min-w-[90px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 bg-slate-50/50 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Frown className="w-12 h-12 mb-4 text-slate-400" strokeWidth={1.5} />
                      <p className="text-lg font-medium text-slate-600">Nothing found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <td className="px-6 py-5 font-bold text-slate-800">{order.code}</td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-800">{order.customer.name}</div>
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {formatSellerDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                        <PackageCheck className="h-4 w-4" />
                        {order.productCount}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-800">
                      {formatSellerMoney(order.amount)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-emerald-700">
                        {formatSellerMoney(order.profit)}
                      </div>
                      <div className="text-xs font-semibold text-slate-400">
                        {order.profitPercent}%
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        Paid
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="max-w-[260px] space-y-1">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="truncate text-slate-600">
                            {item.quantity} x {item.name}
                          </div>
                        ))}
                        {order.items.length > 2 ? (
                          <div className="text-xs font-semibold text-slate-400">
                            +{order.items.length - 2} more
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'icon' })}
                        aria-label={`View order ${order.code}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="bg-blue-600 text-white border-none shadow-sm">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-10 h-10 rounded-full bg-blue-500/50 flex items-center justify-center mb-4">
          <ArrowUpCircle className="w-6 h-6 text-blue-200" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold mb-2">{value}</h2>
        <p className="text-blue-100 text-sm font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

function OrderMobileCard({ order }: { order: SellerOrder }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order</p>
          <h3 className="truncate text-base font-black text-slate-900">{order.code}</h3>
          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
            {order.customer.name}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-4">
        <div>
          <p className="text-slate-400">Date</p>
          <p className="font-semibold text-slate-700">{formatSellerDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-slate-400">Items</p>
          <p className="font-semibold text-slate-700">{order.productCount}</p>
        </div>
        <div>
          <p className="text-slate-400">Amount</p>
          <p className="font-black text-slate-900">{formatSellerMoney(order.amount)}</p>
        </div>
        <div>
          <p className="text-slate-400">Profit</p>
          <p className="font-black text-emerald-700">{formatSellerMoney(order.profit)}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-600">
        {order.items.slice(0, 2).map((item) => (
          <p key={item.id} className="truncate">
            {item.quantity} x {item.name}
          </p>
        ))}
        {order.items.length > 2 ? (
          <p className="text-xs font-semibold text-slate-400">+{order.items.length - 2} more</p>
        ) : null}
      </div>
      <Link
        href={`/seller/orders/${order.id}`}
        className={buttonVariants({ variant: 'outline', className: 'mt-4 w-full' })}
      >
        <Eye className="mr-2 h-4 w-4" />
        View details
      </Link>
    </article>
  );
}

function StatusBadge({ status }: { status: SellerOrder['status'] }) {
  const classes = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PICKED_UP: 'bg-violet-50 text-violet-700 border-violet-200',
    SHIPPED: 'bg-sky-50 text-sky-700 border-sky-200',
    ON_THE_WAY: 'bg-sky-50 text-sky-700 border-sky-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  }[status];
  const label = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PICKED_UP: 'Picked up',
    SHIPPED: 'On the way',
    ON_THE_WAY: 'On the way',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancel',
  }[status];

  return <Badge className={cn('border hover:bg-inherit', classes)}>{label}</Badge>;
}
