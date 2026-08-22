'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  Truck,
  UserRound,
  Unlock,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PaymentStatus = 'PAID' | 'UNPAID';
type DeliveryStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

interface AdminOrderDetail {
  id: string;
  code: string;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  productCount: number;
  date: string;
  paymentMethod: string | null;
  deliveryType: string | null;
  trackingCode: string | null;
  logisticsCompany: string | null;
  logisticsNotes: string | null;
  shop: string;
  sellerEmail: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  shippingAddress: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
    country: string;
    phone?: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    image: string | null;
    quantity: number;
    price: number;
    lineTotal: number;
    seller: {
      email: string;
      shopName: string;
    } | null;
  }>;
}

interface OrderDetailResponse {
  data: AdminOrderDetail;
}

interface OrderDeletionPreview {
  order: { id: string; code: string; customerName: string; amount: number; itemCount: number };
  adjustments: Array<{ sellerId: string; shopName: string; walletAdjustment: number; pendingAdjustment: number; source: 'recorded' | 'derived' }>;
}

const paymentOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'PAID', label: 'Paid' },
  { value: 'UNPAID', label: 'Unpaid' },
];

const deliveryOptions: Array<{ value: DeliveryStatus; label: string }> = [
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
  return money.format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const orderQuery = useQuery({
    queryKey: ['admin', 'sales', 'order', orderId],
    queryFn: () => apiClient.get<OrderDetailResponse>(`/api/admin/sales/orders/${orderId}`),
    enabled: Boolean(orderId),
  });

  const order = orderQuery.data?.data;

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-full bg-slate-50 p-4 md:p-6">
        <div className="grid min-h-[520px] place-items-center rounded-md border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
            <p className="font-semibold text-slate-700">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-full bg-slate-50 p-4 md:p-6">
        <div className="rounded-md border border-slate-200 bg-white p-10 text-center">
          <h1 className="text-xl font-black text-slate-950">Order not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This order may have been removed or is unavailable.
          </p>
          <Link
            href="/admin/sales"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
          >
            Back to sales
          </Link>
        </div>
      </div>
    );
  }

  const orderStateKey = [
    order.id,
    order.paymentStatus,
    order.deliveryStatus,
    order.trackingCode || '',
    order.logisticsCompany || '',
    order.logisticsNotes || '',
  ].join(':');

  return <OrderDetailsContent key={orderStateKey} order={order} orderId={orderId} />;
}

function OrderDetailsContent({ order, orderId }: { order: AdminOrderDetail; orderId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(order.deliveryStatus);
  const [trackingCode, setTrackingCode] = useState(order.trackingCode || '');
  const [logisticsCompany, setLogisticsCompany] = useState(order.logisticsCompany || '');
  const [logisticsNotes, setLogisticsNotes] = useState(order.logisticsNotes || '');

  const totals = useMemo(() => {
    const subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
    return {
      subtotal,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: order.amount || subtotal,
    };
  }, [order]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.patch<OrderDetailResponse>(`/api/admin/sales/orders/${orderId}`, {
        paymentStatus,
        deliveryStatus,
        trackingCode,
        logisticsCompany,
        logisticsNotes,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(['admin', 'sales', 'order', orderId], result);
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'orders'] });
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update order'));
    },
  });

  const releaseFundsMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{
        data: AdminOrderDetail;
        wallet: { walletMoney: number };
      }>(`/api/admin/sales/orders/${orderId}/release-frozen-funds`, {}),
    onSuccess: (result) => {
      queryClient.setQueryData(['admin', 'sales', 'order', orderId], { data: result.data });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'orders'] });
      toast.success('Frozen funds released to seller wallet successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to release frozen funds'));
    },
  });
  const deletionPreviewQuery = useQuery({
    queryKey: ['admin', 'sales', 'order-deletion-preview', orderId],
    queryFn: () => apiClient.get<{ data: OrderDeletionPreview }>(`/api/admin/sales/orders/${orderId}/deletion-preview`),
    enabled: isDeleteOpen,
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/admin/sales/orders/${orderId}`),
    onSuccess: () => {
      toast.success('Order and seller balance movements deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      router.push('/admin/sales');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to delete order')),
  });

  const isDirty =
    paymentStatus !== order.paymentStatus ||
    deliveryStatus !== order.deliveryStatus ||
    trackingCode !== (order.trackingCode || '') ||
    logisticsCompany !== (order.logisticsCompany || '') ||
    logisticsNotes !== (order.logisticsNotes || '');

  return (
    <div className="min-h-full bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin/sales"
              className="-ml-2 mb-2 inline-flex h-9 items-center rounded-lg px-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to orders
            </Link>
            <Button variant="destructive" className="mb-2 ml-2 h-9" onClick={() => setIsDeleteOpen(true)}><Trash2 className="mr-2 size-4" /> Delete order</Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-all text-2xl font-black tracking-tight md:text-3xl">
                Order {order.code}
              </h1>
              <StatusBadge status={deliveryStatus} />
              <PaymentBadge status={paymentStatus} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Placed {formatDate(order.date)} by {order.customer.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
            <Metric icon={ReceiptText} label="Total" value={formatMoney(order.amount)} />
            <Metric icon={PackageCheck} label="Items" value={order.productCount.toString()} />
            <Metric
              icon={Banknote}
              label="Payment"
              value={paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
            />
            <Metric icon={Truck} label="Delivery" value={deliveryLabel(deliveryStatus)} />
          </div>
        </div>
      </div>

      <main className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-6">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 md:p-5">
              <h2 className="text-lg font-black text-slate-950">Customer and Shipping</h2>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
              <InfoBlock icon={UserRound} title={order.customer.name}>
                <InfoLine icon={Mail} text={order.customer.email} />
                <InfoLine icon={Phone} text={order.customer.phone || 'No phone number'} />
              </InfoBlock>
              <InfoBlock icon={MapPin} title="Delivery address">
                <p className="text-sm leading-6 text-slate-600">
                  {[
                    order.shippingAddress.street,
                    order.shippingAddress.city,
                    order.shippingAddress.state,
                    order.shippingAddress.zip,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  <br />
                  {order.shippingAddress.country}
                </p>
              </InfoBlock>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">Products</h2>
                <p className="text-sm text-slate-500">
                  {order.items.length} line item{order.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <Badge className="w-fit border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50">
                {order.shop}
              </Badge>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Seller</th>
                    <th className="px-5 py-4 text-center">Qty</th>
                    <th className="px-5 py-4 text-right">Price</th>
                    <th className="px-5 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <ProductCell item={item} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {item.seller?.shopName || order.shop}
                        </div>
                        <div className="max-w-[220px] truncate text-xs text-slate-500">
                          {item.seller?.email || order.sellerEmail}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-black">{item.quantity}</td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {formatMoney(item.price)}
                      </td>
                      <td className="px-5 py-4 text-right font-black">
                        {formatMoney(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {order.items.map((item) => (
                <article key={item.id} className="rounded-md border border-slate-200 p-3">
                  <ProductCell item={item} />
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-3 text-sm">
                    <MiniTotal label="Qty" value={item.quantity.toString()} />
                    <MiniTotal label="Price" value={formatMoney(item.price)} />
                    <MiniTotal label="Total" value={formatMoney(item.lineTotal)} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-slate-950 text-white">
                <Truck className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Logistics Information</h2>
                <p className="text-sm text-slate-500">
                  Carrier, tracking, and internal delivery notes.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Logistics company">
                <Input
                  value={logisticsCompany}
                  onChange={(event) => setLogisticsCompany(event.target.value)}
                  placeholder="FedEx, UPS, DHL..."
                  className="h-11 border-slate-200"
                />
              </Field>
              <Field label="Tracking code">
                <div className="flex gap-2">
                  <Input
                    value={trackingCode}
                    onChange={(event) => setTrackingCode(event.target.value)}
                    placeholder="Optional tracking code"
                    className="h-11 border-slate-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="size-11 shrink-0"
                    disabled={!trackingCode}
                    onClick={() => {
                      navigator.clipboard.writeText(trackingCode);
                      toast.success('Tracking code copied');
                    }}
                    aria-label="Copy tracking code"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </Field>
              <Field label="Delivery notes" className="md:col-span-2">
                <Textarea
                  value={logisticsNotes}
                  onChange={(event) => setLogisticsNotes(event.target.value)}
                  placeholder="Add delivery notes for the operations team."
                  className="min-h-28 resize-none border-slate-200"
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Actions</h2>
                <p className="text-sm text-slate-500">Update fulfillment states.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Payment status">
                <Select
                  value={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
                >
                  <SelectTrigger className="h-11 w-full border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Delivery status">
                <Select
                  value={deliveryStatus}
                  onValueChange={(value) => setDeliveryStatus(value as DeliveryStatus)}
                >
                  <SelectTrigger className="h-11 w-full border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button
                className="h-12 w-full bg-slate-950 font-bold text-white hover:bg-slate-800"
                disabled={!isDirty || updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save order changes'}
              </Button>

              <Button
                className="h-12 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                disabled={releaseFundsMutation.isPending}
                onClick={() => releaseFundsMutation.mutate()}
              >
                {releaseFundsMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2 inline-block">⟳</span> Releasing...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 size-4" /> Release Frozen Funds
                  </>
                )}
              </Button>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <h2 className="mb-4 text-lg font-black">Order Summary</h2>
            <SummaryRow label="Storehouse price" value={formatMoney(0)} />
            <SummaryRow label="Profit" value={formatMoney(0)} />
            <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} />
            <SummaryRow label="Tax" value={formatMoney(totals.tax)} />
            <SummaryRow label="Shipping" value={formatMoney(totals.shipping)} />
            <SummaryRow label="Coupon" value={formatMoney(totals.discount)} />
            <div className="mt-4 flex items-center justify-between rounded-md bg-slate-950 p-4 text-white">
              <span className="text-sm font-bold">Total</span>
              <span className="text-2xl font-black">{formatMoney(totals.total)}</span>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <h2 className="mb-4 text-lg font-black">Order Metadata</h2>
            <MetaRow label="Order ID" value={order.id} />
            <MetaRow label="Payment method" value={order.paymentMethod || 'Not specified'} />
            <MetaRow label="Delivery type" value={order.deliveryType || 'Online order'} />
            <MetaRow label="Seller email" value={order.sellerEmail} />
          </section>
        </aside>
      </main>
      <Dialog open={isDeleteOpen} onOpenChange={(open) => !deleteMutation.isPending && setIsDeleteOpen(open)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Delete order {order.code}</DialogTitle><DialogDescription>This is permanent and reverses the seller balance movements before deleting the order.</DialogDescription></DialogHeader>
          {deletionPreviewQuery.isLoading ? <div className="py-8 text-center text-slate-500">Calculating balance reversals…</div> : deletionPreviewQuery.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load the accounting preview.<Button variant="outline" className="mt-3 w-full" onClick={() => deletionPreviewQuery.refetch()}>Try again</Button></div> : deletionPreviewQuery.data ? <div className="space-y-3">{deletionPreviewQuery.data.data.adjustments.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No seller balances were affected by this order.</div> : deletionPreviewQuery.data.data.adjustments.map((item) => <div key={item.sellerId} className="rounded-xl border border-slate-200 p-4"><p className="font-bold">{item.shopName}</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-500">Wallet</p><p className={cn('font-black', item.walletAdjustment < 0 ? 'text-rose-600' : 'text-emerald-700')}>{item.walletAdjustment >= 0 ? '+' : ''}{formatMoney(item.walletAdjustment)}</p></div><div><p className="text-slate-500">Pending</p><p className={cn('font-black', item.pendingAdjustment < 0 ? 'text-rose-600' : 'text-emerald-700')}>{item.pendingAdjustment >= 0 ? '+' : ''}{formatMoney(item.pendingAdjustment)}</p></div></div></div>)}</div> : null}
          <DialogFooter><Button variant="outline" disabled={deleteMutation.isPending} onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button variant="destructive" disabled={!deletionPreviewQuery.data || deletionPreviewQuery.isError || deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>{deleteMutation.isPending ? 'Deleting…' : 'Delete and reverse balances'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <Icon className="mb-2 size-4 text-slate-500" />
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-md bg-slate-100 text-slate-700">
          <Icon className="size-4" />
        </div>
        <h3 className="min-w-0 break-words font-black text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="break-all">{text}</span>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block space-y-2', className)}>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ProductCell({ item }: { item: AdminOrderDetail['items'][number] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <PackageCheck className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
        )}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-2 font-bold text-slate-900">{item.name}</div>
        <div className="mt-1 text-xs text-slate-500">Line item {item.id.slice(-6)}</div>
      </div>
    </div>
  );
}

function MiniTotal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
      <div className="mt-1 font-black text-slate-900">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      className={cn(
        'border hover:bg-inherit',
        status === 'PAID'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      )}
    >
      {status === 'PAID' ? 'Paid' : 'Unpaid'}
    </Badge>
  );
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const classes = {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    CONFIRMED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    PICKED_UP: 'border-violet-200 bg-violet-50 text-violet-700',
    ON_THE_WAY: 'border-sky-200 bg-sky-50 text-sky-700',
    DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  }[status];

  return <Badge className={cn('border hover:bg-inherit', classes)}>{deliveryLabel(status)}</Badge>;
}

function deliveryLabel(status: DeliveryStatus) {
  return {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PICKED_UP: 'Picked up',
    ON_THE_WAY: 'On the way',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancel',
  }[status];
}
