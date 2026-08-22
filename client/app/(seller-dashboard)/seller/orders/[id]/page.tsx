'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ComponentType, type ReactNode } from 'react';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  EyeOff,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TransactionPasswordDialog } from '@/components/seller/TransactionPasswordDialog';
import {
  formatSellerDate,
  formatSellerMoney,
  sellerApiGet,
  sellerApiPatch,
  sellerApiPost,
  SellerOrder,
} from '@/lib/seller-orders';
import { cn } from '@/lib/utils';

interface SellerOrderDetailResponse {
  data: SellerOrder;
}

type SellerDeliveryStatus = Exclude<SellerOrder['status'], 'PROCESSING' | 'SHIPPED'>;

const deliveryOptions: Array<{ value: SellerDeliveryStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'ON_THE_WAY', label: 'On The Way' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const deliverySteps: SellerDeliveryStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
];

function getSellerDisplayDeliveryStatus(status: SellerOrder['status']): SellerDeliveryStatus {
  if (status === 'CONFIRMED') return 'CONFIRMED';
  if (status === 'SHIPPED') return 'ON_THE_WAY';
  return status;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const orderQuery = useQuery({
    queryKey: ['seller', 'orders', orderId],
    queryFn: () => sellerApiGet<SellerOrderDetailResponse>(`/api/seller/orders/${orderId}`),
    enabled: Boolean(orderId),
  });

  const order = orderQuery.data?.data;

  if (orderQuery.isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <Card className="min-h-[420px] rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="grid min-h-[420px] place-items-center p-8 text-center text-slate-500">
            <div>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="font-semibold">Loading order details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-black text-slate-900">Order not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              This order is unavailable or does not belong to your shop.
            </p>
            <Link
              href="/seller/orders"
              className={buttonVariants({ className: 'mt-6 bg-blue-600 hover:bg-blue-700' })}
            >
              Back to orders
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const orderStateKey = [order.id, order.status].join(':');

  return (
    <SellerOrderDetailContent
      key={orderStateKey}
      order={order}
      orderId={orderId}
      subtotal={subtotal}
    />
  );
}

function SellerOrderDetailContent({
  order,
  orderId,
  subtotal,
}: {
  order: SellerOrder;
  orderId: string;
  subtotal: number;
}) {
  const queryClient = useQueryClient();
  const initialStatus = getSellerDisplayDeliveryStatus(order.status);
  const [deliveryStatus, setDeliveryStatus] = useState<SellerDeliveryStatus>(initialStatus);
  const [transactionPasswordDialogOpen, setTransactionPasswordDialogOpen] = useState(false);
  const [hasPickedUp, setHasPickedUp] = useState(order.status === 'PICKED_UP');

  const updateMutation = useMutation({
    mutationFn: () =>
      sellerApiPatch<SellerOrderDetailResponse>(`/api/seller/orders/${orderId}`, {
        deliveryStatus,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(['seller', 'orders', orderId], result);
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders', 'summary'] });
      toast.success('Delivery status updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update delivery status'));
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (transactionPassword: string) =>
      sellerApiPost<{
        data: SellerOrder;
        wallet: {
          walletMoney: number;
          pendingBalance: number;
        };
      }>(`/api/seller/orders/${orderId}/payment-for-storehouse`, {
        transactionPassword,
      }),
    onSuccess: (result) => {
      // Update the order data
      queryClient.setQueryData(['seller', 'orders', orderId], { data: result.data });
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });

      setHasPickedUp(true);
      setDeliveryStatus('PICKED_UP');
      toast.success('Order picked up successfully.');
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error, 'Failed to process payment');
      toast.error(errorMessage);
      throw error;
    },
  });

  const isDirty = deliveryStatus !== initialStatus;
  const maskedAddress =
    [order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.country]
      .filter(Boolean)
      .join(', ') || 'Hidden';
  const activeStepIndex = deliverySteps.indexOf(deliveryStatus);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 p-3 sm:p-4 lg:p-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,600px)] xl:items-end">
          <div className="min-w-0">
            <Link
              href="/seller/orders"
              className={buttonVariants({
                variant: 'ghost',
                className: '-ml-3 mb-4 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-950',
              })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to orders
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-all text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                Order {order.code}
              </h1>
              <StatusBadge status={deliveryStatus} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
              <span>Placed {formatSellerDate(order.createdAt)}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              <span>
                {order.items.length} line item{order.items.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* <KpiTile icon={ReceiptText} label="Subtotal" value={formatSellerMoney(subtotal)} /> */}
            {/* <KpiTile icon={Banknote} label="Profit" value={formatSellerMoney(order.profit)} /> */}
            {/* <KpiTile icon={PackageCheck} label="Items" value={String(order.productCount)} /> */}
            <KpiTile icon={Truck} label="Delivery" value={deliveryLabel(deliveryStatus)} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-4">
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <SectionTitle icon={ShieldCheck} title="Customer Privacy" />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <PrivacyBlock icon={UserRound} title="Customer">
                  <PrivacyLine label="Name" text={order.customer.name} />
                </PrivacyBlock>
                <PrivacyBlock icon={ShieldCheck} title="Contact">
                  <PrivacyLine label="Email" text={order.customer.email || 'Hidden'} />
                  <PrivacyLine label="Phone" text={order.customer.phone || 'Hidden'} />
                </PrivacyBlock>
                <PrivacyBlock icon={EyeOff} title="Address">
                  <PrivacyLine label="Masked Address" text={maskedAddress} />
                </PrivacyBlock>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <SectionTitle icon={PackageCheck} title="Order Items" />
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-black">Product</th>
                    <th className="px-5 py-4 text-center font-black">Qty</th>
                    <th className="px-5 py-4 text-right font-black">Price</th>
                    <th className="px-5 py-4 text-right font-black">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <ProductCell item={item} />
                      </td>
                      <td className="px-5 py-4 text-center font-black text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-700">
                        {formatSellerMoney(item.price)}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-950">
                        {formatSellerMoney(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CardContent className="space-y-3 p-4 lg:hidden">
              {order.items.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <ProductCell item={item} />
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-3 text-sm">
                    <MiniTotal label="Qty" value={String(item.quantity)} />
                    <MiniTotal label="Price" value={formatSellerMoney(item.price)} />
                    <MiniTotal label="Total" value={formatSellerMoney(item.lineTotal)} />
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          {/* Payment for Storehouse Card */}
          {!hasPickedUp && (
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <SectionTitle icon={Banknote} title="Payment Processing" />
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    Complete the payment for this order to move it to Picked Up status.
                  </p>
                  <div className="space-y-2 rounded-md bg-blue-50 p-3">
                    <div className="text-xs font-bold uppercase text-slate-500">
                      Storehouse Deduction
                    </div>
                    <div className="text-sm font-bold text-slate-700">
                      {formatSellerMoney(order.amount * 0.85)}
                    </div>
                    <div className="text-xs text-slate-500">From your wallet balance</div>
                  </div>
                  <Button
                    onClick={() => setTransactionPasswordDialogOpen(true)}
                    disabled={paymentMutation.isPending}
                    className="h-11 w-full rounded-md bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {paymentMutation.isPending ? 'Processing...' : 'Payment for Storehouse'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {hasPickedUp && order.status === 'PICKED_UP' && (
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">Picked Up</div>
                    <div className="text-xs text-slate-500">Payment processed successfully</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fulfillment Track Card */}
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <SectionTitle icon={CheckCircle2} title="Fulfillment Track" />
              <div className="mt-5 space-y-3">
                {deliverySteps.map((step, index) => {
                  const isComplete = activeStepIndex >= index && deliveryStatus !== 'CANCELLED';
                  const isCurrent = deliveryStatus === step;

                  return (
                    <div key={step} className="flex items-center gap-3">
                      <span
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-black',
                          isComplete
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-400'
                        )}
                      >
                        {index + 1}
                      </span>
                      <p
                        className={cn(
                          'min-w-0 flex-1 truncate text-sm font-bold',
                          isCurrent
                            ? 'text-slate-950'
                            : isComplete
                              ? 'text-slate-700'
                              : 'text-slate-400'
                        )}
                      >
                        {deliveryLabel(step)}
                      </p>
                      {isCurrent && (
                        <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                          Current
                        </Badge>
                      )}
                    </div>
                  );
                })}

                {deliveryStatus === 'CANCELLED' && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                    Cancelled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <SectionTitle icon={ReceiptText} title="Financial Summary" />
              <div className="mt-4">
                <SummaryRow label="Subtotal" value={formatSellerMoney(subtotal)} />
                <SummaryRow
                  label={`Profit (${order.profitPercent}%)`}
                  value={formatSellerMoney(order.profit)}
                />
                <SummaryRow label="Payment method" value={order.paymentMethod || 'Not specified'} />
              </div>
              <div className="mt-4 rounded-lg bg-slate-950 p-4 text-white">
                <div className="text-sm font-bold text-slate-300">Total</div>
                <div className="mt-1 break-words text-3xl font-black tracking-tight">
                  {formatSellerMoney(order.amount)}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Transaction Password Dialog */}
      <TransactionPasswordDialog
        open={transactionPasswordDialogOpen}
        onOpenChange={setTransactionPasswordDialogOpen}
        onSubmit={async (password) => {
          await paymentMutation.mutateAsync(password);
        }}
        isLoading={paymentMutation.isPending}
      />
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="min-w-0 text-lg font-black leading-tight text-slate-900">{title}</h2>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="min-h-[92px] rounded-md border border-slate-200 bg-slate-50 p-3">
      <Icon className="mb-2 h-4 w-4 text-blue-600" />
      <div className="text-[11px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}

function PrivacyBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-slate-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="min-w-0 truncate font-black text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PrivacyLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-0.5 break-all text-sm font-semibold text-slate-700">{text}</div>
    </div>
  );
}

function ProductCell({ item }: { item: SellerOrder['items'][number] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <PackageCheck className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
        )}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-2 font-bold text-slate-900">{item.name}</div>
        <div className="mt-1 text-xs font-medium text-slate-500">Line item {item.id.slice(-6)}</div>
      </div>
    </div>
  );
}

function MiniTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 truncate font-black text-slate-900">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: SellerDeliveryStatus }) {
  const classes = {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    CONFIRMED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    PICKED_UP: 'border-violet-200 bg-violet-50 text-violet-700',
    ON_THE_WAY: 'border-sky-200 bg-sky-50 text-sky-700',
    DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  }[status];

  return (
    <Badge className={cn('border font-black hover:bg-inherit', classes)}>
      {deliveryLabel(status)}
    </Badge>
  );
}

function deliveryLabel(status: SellerDeliveryStatus) {
  return {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PICKED_UP: 'Picked Up',
    ON_THE_WAY: 'On The Way',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }[status];
}
