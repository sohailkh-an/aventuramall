'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CalendarDays,
  Download,
  Eye,
  Filter,
  PackageCheck,
  RefreshCcw,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type OrderStatus =
  | 'ALL'
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
  status: Exclude<OrderStatus, 'ALL'>;
  deliveryStatus: Exclude<OrderStatus, 'ALL'>;
  paymentStatus: 'PAID' | 'UNPAID';
  amount: number;
  productCount: number;
  date: string;
  paymentMethod: string | null;
  deliveryType: string | null;
  shop: string;
  sellerEmail: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  shippingAddress: {
    city: string;
    state: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface OrdersResponse {
  data: AdminSalesOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrderDeletionPreview {
  order: { id: string; code: string; customerName: string; customerEmail: string; amount: number; itemCount: number };
  adjustments: Array<{ sellerId: string; shopName: string; sellerEmail: string; walletAdjustment: number; pendingAdjustment: number; source: 'recorded' | 'derived' }>;
}

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'ALL', label: 'All delivery statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PICKED_UP', label: 'Picked up' },
  { value: 'ON_THE_WAY', label: 'On the way' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancel' },
];

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatMoney(value: number) {
  return money.format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildQuery(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (String(value).trim()) searchParams.set(key, String(value));
  });
  return `?${searchParams.toString()}`;
}

export default function AdminSalesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OrderStatus>('ALL');
  const [date, setDate] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'ALL',
    date: '',
    q: '',
    seller: '',
  });
  const [orderToDelete, setOrderToDelete] = useState<AdminSalesOrder | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['admin', 'sales', 'orders', appliedFilters],
    queryFn: () =>
      apiClient.get<OrdersResponse>(
        `/api/admin/sales/orders${buildQuery({
          page: 1,
          limit: 100,
          status: appliedFilters.status,
          date: appliedFilters.date,
          q: appliedFilters.q,
          seller: appliedFilters.seller,
        })}`
      ),
  });

  const orders = useMemo(() => ordersQuery.data?.data || [], [ordersQuery.data?.data]);
  const deletionPreviewQuery = useQuery({
    queryKey: ['admin', 'sales', 'order-deletion-preview', orderToDelete?.id],
    queryFn: () => apiClient.get<{ data: OrderDeletionPreview }>(`/api/admin/sales/orders/${orderToDelete?.id}/deletion-preview`),
    enabled: Boolean(orderToDelete),
  });
  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/sales/orders/${id}`),
    onSuccess: () => {
      toast.success('Order and its seller balance movements were deleted');
      setOrderToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to delete order'),
  });
  const totalAmount = useMemo(
    () => orders.reduce((sum, order) => sum + order.amount, 0),
    [orders]
  );
  const totalProducts = useMemo(
    () => orders.reduce((sum, order) => sum + order.productCount, 0),
    [orders]
  );

  const applyFilters = () => {
    setAppliedFilters({
      status,
      date,
      q: orderSearch.trim(),
      seller: sellerSearch.trim(),
    });
  };

  const resetFilters = () => {
    setStatus('ALL');
    setDate('');
    setOrderSearch('');
    setSellerSearch('');
    setAppliedFilters({ status: 'ALL', date: '', q: '', seller: '' });
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-950 md:p-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Orders</h1>
            <p className="text-sm text-slate-500">
              Review customer sales from checkout and admin POS orders.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <MetricCard label="Orders" value={ordersQuery.data?.meta.total || 0} />
            <MetricCard label="Products" value={totalProducts} />
            <MetricCard label="Amount" value={formatMoney(totalAmount)} className="col-span-2 md:col-span-1" />
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 xl:grid-cols-[170px_260px_1fr_1fr_110px_auto]">
            <Select value={status} onValueChange={(value) => setStatus((value || 'ALL') as OrderStatus)}>
              <SelectTrigger className="h-12 w-full border-slate-200 bg-white">
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

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-12 border-slate-200 bg-white pl-10"
              />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Type order code, customer name, or email"
                className="h-12 border-slate-200 bg-white pl-10"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters();
                }}
              />
            </div>

            <Input
              value={sellerSearch}
              onChange={(event) => setSellerSearch(event.target.value)}
              placeholder="Seller email or shop"
              className="h-12 border-slate-200 bg-white"
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters();
              }}
            />

            <Button className="h-12 bg-orange-500 text-white hover:bg-orange-600" onClick={applyFilters}>
              <Filter className="mr-2 size-4" />
              Filter
            </Button>
            <Button variant="outline" className="h-12" onClick={resetFilters}>
              <RefreshCcw className="mr-2 size-4" />
              Reset
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="min-w-[44px]">
                    <input type="checkbox" className="size-4 rounded border-slate-300" />
                  </TableHead>
                  <TableHead className="min-w-[150px] text-slate-900">Order Code</TableHead>
                  <TableHead className="min-w-[230px] text-slate-900">Shop</TableHead>
                  <TableHead className="min-w-[120px] text-slate-900">Products</TableHead>
                  <TableHead className="min-w-[170px] text-slate-900">Customer</TableHead>
                  <TableHead className="min-w-[130px] text-slate-900">Amount</TableHead>
                  <TableHead className="min-w-[150px] text-slate-900">Date</TableHead>
                  <TableHead className="min-w-[140px] text-slate-900">Delivery Status</TableHead>
                  <TableHead className="min-w-[140px] text-slate-900">Order Type</TableHead>
                  <TableHead className="min-w-[180px] text-slate-900">Seller Email</TableHead>
                  <TableHead className="min-w-[150px] text-right text-slate-900">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-56 text-center text-slate-500">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-56 text-center">
                      <div className="mx-auto grid max-w-sm place-items-center gap-2 text-slate-500">
                        <ShoppingBag className="size-10" />
                        <div className="font-semibold text-slate-700">No orders found</div>
                        <p className="text-sm">Try clearing filters or placing a POS order.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="border-slate-100">
                      <TableCell>
                        <input type="checkbox" className="size-4 rounded border-slate-300" />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">{order.code}</TableCell>
                      <TableCell>
                        <div className="max-w-[260px] truncate font-medium">{order.shop}</div>
                        <div className="truncate text-xs text-slate-500">
                          {order.shippingAddress.city}, {order.shippingAddress.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PackageCheck className="size-4 text-slate-400" />
                          <span className="font-semibold">{order.productCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="max-w-[180px] truncate text-xs text-slate-500">{order.customer.email}</div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatMoney(order.amount)}</TableCell>
                      <TableCell className="text-sm">{formatDate(order.date)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.deliveryStatus || order.status} />
                      </TableCell>
                      <TableCell>
                        <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                          {order.deliveryType === 'POS' ? 'Virtual order' : order.deliveryType || 'Online'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[220px] truncate">{order.sellerEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <RoundAction href={`/admin/sales/${order.id}`} className="bg-orange-50 text-orange-500">
                            <Eye className="size-4" />
                          </RoundAction>
                          <RoundAction className="bg-sky-50 text-sky-500">
                            <Download className="size-4" />
                          </RoundAction>
                          <RoundAction className="bg-rose-50 text-rose-500" onClick={() => setOrderToDelete(order)} ariaLabel={`Delete order ${order.code}`}>
                            <Trash2 className="size-4" />
                          </RoundAction>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <OrderDeletionDialog
        order={orderToDelete}
        preview={deletionPreviewQuery.data?.data}
        isLoading={deletionPreviewQuery.isLoading}
        isError={deletionPreviewQuery.isError}
        isDeleting={deleteOrderMutation.isPending}
        onClose={() => setOrderToDelete(null)}
        onRetry={() => deletionPreviewQuery.refetch()}
        onDelete={() => orderToDelete && deleteOrderMutation.mutate(orderToDelete.id)}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm', className)}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Exclude<OrderStatus, 'ALL'> }) {
  const classes = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    PROCESSING: 'bg-pink-50 text-pink-700 border-pink-200',
    CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PICKED_UP: 'bg-violet-50 text-violet-700 border-violet-200',
    SHIPPED: 'bg-sky-50 text-sky-700 border-sky-200',
    ON_THE_WAY: 'bg-sky-50 text-sky-700 border-sky-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  }[status];
  const label = {
    PENDING: 'Pending',
    PROCESSING: 'Confirmed',
    CONFIRMED: 'Confirmed',
    PICKED_UP: 'Picked up',
    SHIPPED: 'On the way',
    ON_THE_WAY: 'On the way',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancel',
  }[status];

  return (
    <Badge className={cn('border hover:bg-inherit', classes)}>
      {label}
    </Badge>
  );
}

function RoundAction({
  children,
  className,
  href,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const classes = cn('grid size-11 place-items-center rounded-full transition hover:scale-105', className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="View order details">
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function OrderDeletionDialog({ order, preview, isLoading, isError, isDeleting, onClose, onRetry, onDelete }: {
  order: AdminSalesOrder | null;
  preview?: OrderDeletionPreview;
  isLoading: boolean;
  isError: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Delete order {order?.code}</DialogTitle><DialogDescription>This permanently removes the order and reverses the seller balances shown below.</DialogDescription></DialogHeader>
        {isLoading ? <div className="py-8 text-center text-slate-500">Calculating balance reversals…</div> : isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">The deletion preview could not be loaded.<Button variant="outline" className="mt-3 w-full" onClick={onRetry}>Try again</Button></div> : preview ? <div className="space-y-4"><div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><div><p className="text-slate-500">Customer</p><p className="font-bold text-slate-900">{preview.order.customerName}</p></div><div><p className="text-slate-500">Order amount</p><p className="font-bold text-slate-900">{formatMoney(preview.order.amount)}</p></div><div><p className="text-slate-500">Products</p><p className="font-bold text-slate-900">{preview.order.itemCount}</p></div><div><p className="text-slate-500">Accounting</p><p className="font-bold text-slate-900">{preview.adjustments[0]?.source === 'derived' ? 'Legacy-derived' : 'Recorded'}</p></div></div>{preview.adjustments.map((item) => <div key={item.sellerId} className="rounded-xl border border-slate-200 p-4"><p className="font-bold text-slate-950">{item.shopName}</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-500">Wallet adjustment</p><p className={cn('font-black', item.walletAdjustment < 0 ? 'text-rose-600' : 'text-emerald-700')}>{item.walletAdjustment >= 0 ? '+' : ''}{formatMoney(item.walletAdjustment)}</p></div><div><p className="text-slate-500">Pending adjustment</p><p className={cn('font-black', item.pendingAdjustment < 0 ? 'text-rose-600' : 'text-emerald-700')}>{item.pendingAdjustment >= 0 ? '+' : ''}{formatMoney(item.pendingAdjustment)}</p></div></div></div>)}</div> : null}
        <DialogFooter><Button variant="outline" disabled={isDeleting} onClick={onClose}>Cancel</Button><Button variant="destructive" disabled={!preview || isLoading || isError || isDeleting} onClick={onDelete}>{isDeleting ? 'Deleting…' : 'Delete and reverse balances'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
