'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Wallet,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Lock,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  sellerApiGet,
  type SellerDashboardSummary,
  formatSellerMoney,
  formatSellerDate,
  type SellerOrder,
} from '@/lib/seller-orders';
import { sellerAuthFetch } from '@/lib/seller-auth-client';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PaymentMethod {
  id: string;
  network: 'TRC20' | 'ETH' | 'BTC' | 'BSC' | 'SOL';
  logo: string;
  address: string;
}

interface WalletRecharge {
  id: string;
  amount: number | string;
  approvedAmount: number | string | null;
  receiptImage: string;
  remark: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminMessage: string | null;
  resolvedAt: string | null;
  createdAt: string;
  paymentMethod: PaymentMethod | null;
}

interface WalletWithdrawal {
  id: string;
  amount: number | string;
  payoutAddress: string;
  remark: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminMessage: string | null;
  resolvedAt: string | null;
  createdAt: string;
  paymentMethod: PaymentMethod | null;
}

const EMPTY_PAYMENT_METHODS: PaymentMethod[] = [];
const EMPTY_RECHARGES: WalletRecharge[] = [];
const EMPTY_WITHDRAWALS: WalletWithdrawal[] = [];

function statusBadgeClass(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  if (status === 'APPROVED') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (status === 'REJECTED') return 'bg-red-500/10 text-red-600 border-red-500/20';
  return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
}

function statusLabel(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
}

export default function SellerWithdrawPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'withdrawals' | 'recharges'>('withdrawals');

  // Recharge State
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeRemark, setRechargeRemark] = useState('');
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');

  // Withdrawal State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedWithdrawMethodId, setSelectedWithdrawMethodId] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [withdrawRemark, setWithdrawRemark] = useState('');

  const summaryQuery = useQuery({
    queryKey: ['seller', 'dashboard', 'summary'],
    queryFn: () => sellerApiGet<{ data: SellerDashboardSummary }>('/api/seller/dashboard/summary'),
  });

  const methodsQuery = useQuery({
    queryKey: ['seller', 'payment-methods'],
    queryFn: () => sellerApiGet<{ data: PaymentMethod[] }>('/api/seller/payment-methods'),
  });

  const rechargesQuery = useQuery({
    queryKey: ['seller', 'wallet-recharges'],
    queryFn: () => sellerApiGet<{ data: WalletRecharge[] }>('/api/seller/wallet-recharges'),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['seller', 'wallet-withdrawals'],
    queryFn: () => sellerApiGet<{ data: WalletWithdrawal[] }>('/api/seller/wallet-withdrawals'),
  });

  const ordersQuery = useQuery({
    queryKey: ['seller', 'orders', 'frozen'],
    queryFn: () =>
      sellerApiGet<{
        data: SellerOrder[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>('/api/seller/orders?limit=100'),
  });

  const balances = summaryQuery.data?.data.balances;
  const paymentMethods = methodsQuery.data?.data ?? EMPTY_PAYMENT_METHODS;
  const recharges = rechargesQuery.data?.data ?? EMPTY_RECHARGES;
  const withdrawals = withdrawalsQuery.data?.data ?? EMPTY_WITHDRAWALS;

  const frozenOrders = useMemo(() => {
    const allOrders = ordersQuery.data?.data ?? [];
    return allOrders.filter((order) => !['PENDING', 'CONFIRMED'].includes(order.status));
  }, [ordersQuery.data?.data]);

  const selectedRechargeMethod = useMemo(
    () => paymentMethods.find((item) => item.id === selectedPaymentMethodId) || null,
    [paymentMethods, selectedPaymentMethodId]
  );

  const pendingRecharge = useMemo(
    () => recharges.find((item) => item.status === 'PENDING') || null,
    [recharges]
  );

  const pendingWithdrawal = useMemo(
    () => withdrawals.find((item) => item.status === 'PENDING') || null,
    [withdrawals]
  );

  // Submit Recharge Mutation
  const submitRechargeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('seller_auth_token');
      const response = await sellerAuthFetch(`${API_BASE}/api/seller/wallet-recharges`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentMethodId: selectedPaymentMethodId,
          amount: Number(rechargeAmount),
          receiptBase64,
          remark: rechargeRemark.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit recharge request');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Recharge request submitted. It will appear after admin review.');
      setIsRechargeOpen(false);
      setSelectedPaymentMethodId('');
      setRechargeAmount('');
      setRechargeRemark('');
      setReceiptBase64('');
      setReceiptFileName('');
      queryClient.invalidateQueries({ queryKey: ['seller', 'wallet-recharges'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard', 'summary'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit recharge request');
    },
  });

  // Submit Withdrawal Mutation
  const submitWithdrawalMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('seller_auth_token');
      const response = await sellerAuthFetch(`${API_BASE}/api/seller/wallet-withdrawals`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentMethodId: selectedWithdrawMethodId || undefined,
          payoutAddress: withdrawAddress.trim(),
          amount: Number(withdrawAmount),
          transactionPassword,
          remark: withdrawRemark.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit withdrawal request');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully.');
      setIsWithdrawOpen(false);
      setSelectedWithdrawMethodId('');
      setWithdrawAddress('');
      setWithdrawAmount('');
      setTransactionPassword('');
      setWithdrawRemark('');
      queryClient.invalidateQueries({ queryKey: ['seller', 'wallet-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard', 'summary'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit withdrawal request');
    },
  });

  const onReceiptSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt image must be 5MB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(String(reader.result || ''));
      setReceiptFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Wallet address copied');
    } catch {
      toast.error('Could not copy address');
    }
  };

  const submitRecharge = () => {
    if (!selectedPaymentMethodId) {
      toast.error('Select a payment network');
      return;
    }
    if (!rechargeAmount || Number(rechargeAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!receiptBase64) {
      toast.error('Upload receipt image');
      return;
    }
    if (pendingRecharge) {
      toast.error('Your previous recharge request is still pending review');
      return;
    }
    submitRechargeMutation.mutate();
  };

  const submitWithdrawal = () => {
    if (!withdrawAddress.trim()) {
      toast.error('Enter a valid payout wallet address');
      return;
    }
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error('Enter a valid withdrawal amount');
      return;
    }
    const currentBalance = Number(balances?.walletMoney || 0);
    if (Number(withdrawAmount) > currentBalance) {
      toast.error(`Amount exceeds available balance (${formatSellerMoney(currentBalance)})`);
      return;
    }
    if (!transactionPassword) {
      toast.error('Enter your transaction password');
      return;
    }
    if (pendingWithdrawal) {
      toast.error('You already have a pending withdrawal request');
      return;
    }
    submitWithdrawalMutation.mutate();
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Wallet Overview Cards */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
          <StatTile
            icon={<CreditCard className="h-5 w-5" />}
            label="Pending Balance"
            value={formatSellerMoney(balances?.pendingBalance)}
            tone="blue"
          />
          <StatTile
            icon={<Wallet className="h-5 w-5" />}
            label="Wallet Money"
            value={formatSellerMoney(balances?.walletMoney)}
            tone="orange"
            action={
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    onClick={() => setIsRechargeOpen(true)}
                    disabled={!!pendingRecharge}
                  >
                    <ArrowDownLeft className="mr-1.5 h-4 w-4" />
                    Deposit
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
                    onClick={() => {
                      setIsWithdrawOpen(true);
                      if (paymentMethods.length > 0 && !selectedWithdrawMethodId) {
                        setSelectedWithdrawMethodId(paymentMethods[0].id);
                      }
                    }}
                    disabled={balances?.allowWithdraw === false || !!pendingWithdrawal}
                  >
                    <ArrowUpRight className="mr-1.5 h-4 w-4" />
                    Withdraw
                  </Button>
                </div>
                {balances?.allowWithdraw === false ? (
                  <div className="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Withdrawals are currently disabled for your account.
                  </div>
                ) : pendingWithdrawal ? (
                  <div className="text-xs font-medium text-amber-600">
                    Pending withdrawal of {formatSellerMoney(pendingWithdrawal.amount)} from{' '}
                    {formatSellerDate(pendingWithdrawal.createdAt)}.
                  </div>
                ) : pendingRecharge ? (
                  <div className="text-xs font-medium text-amber-600">
                    Pending deposit from {formatSellerDate(pendingRecharge.createdAt)} must be resolved first.
                  </div>
                ) : null}
              </div>
            }
          />
          <StatTile
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Guarantee Money"
            value={formatSellerMoney(balances?.guaranteeMoney)}
            tone="violet"
          />
        </CardContent>
      </Card>

      {/* Custom Tabs */}
      <div className="w-full space-y-4">
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-md transition-all sm:text-sm',
              activeTab === 'withdrawals'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Withdrawal History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recharges')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-md transition-all sm:text-sm',
              activeTab === 'recharges'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Deposit History
          </button>
        </div>

        {/* Withdrawal History Tab Content */}
        {activeTab === 'withdrawals' ? (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                Wallet Withdrawal History
              </CardTitle>
              {withdrawalsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              {withdrawals.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No withdrawal requests yet.
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 font-medium">Network</th>
                          <th className="px-5 py-3 font-medium">Amount</th>
                          <th className="px-5 py-3 font-medium">Payout Address</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Remark</th>
                          <th className="px-5 py-3 font-medium">Admin Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((item) => (
                          <tr key={item.id} className="border-t border-slate-100 align-top">
                            <td className="px-5 py-4 text-slate-600">
                              {formatSellerDate(item.createdAt)}
                            </td>
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {item.paymentMethod?.network || 'CRYPTO/USDT'}
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {formatSellerMoney(item.amount)}
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-slate-700 break-all max-w-[200px]">
                              {item.payoutAddress}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                                  statusBadgeClass(item.status)
                                )}
                              >
                                {statusLabel(item.status)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">{item.remark || '-'}</td>
                            <td className="px-5 py-4 text-slate-600">{item.adminMessage || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 p-4 lg:hidden">
                    {withdrawals.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {item.paymentMethod?.network || 'CRYPTO/USDT'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatSellerDate(item.createdAt)}
                            </div>
                          </div>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              statusBadgeClass(item.status)
                            )}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-slate-700 space-y-1">
                          <div>
                            Amount:{' '}
                            <span className="font-semibold text-slate-900">
                              {formatSellerMoney(item.amount)}
                            </span>
                          </div>
                          <div className="text-xs break-all">
                            <span className="text-slate-500">Address:</span> {item.payoutAddress}
                          </div>
                          {item.remark ? <div className="text-xs">Remark: {item.remark}</div> : null}
                          {item.adminMessage ? (
                            <div className="text-xs text-slate-600">Admin note: {item.adminMessage}</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Deposit / Recharge History Tab Content */
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                Wallet Recharge History
              </CardTitle>
              {rechargesQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              {recharges.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No recharge requests yet.</div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 font-medium">Network</th>
                          <th className="px-5 py-3 font-medium">Amount</th>
                          <th className="px-5 py-3 font-medium">Credited</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Remark</th>
                          <th className="px-5 py-3 font-medium">Admin Note</th>
                          <th className="px-5 py-3 font-medium">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recharges.map((item) => (
                          <tr key={item.id} className="border-t border-slate-100 align-top">
                            <td className="px-5 py-4 text-slate-600">
                              {formatSellerDate(item.createdAt)}
                            </td>
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {item.paymentMethod?.network || 'Deleted Method'}
                            </td>
                            <td className="px-5 py-4 text-slate-900">
                              {formatSellerMoney(item.amount)}
                            </td>
                            <td className="px-5 py-4 text-slate-900">
                              {item.approvedAmount ? formatSellerMoney(item.approvedAmount) : '-'}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                                  statusBadgeClass(item.status)
                                )}
                              >
                                {statusLabel(item.status)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">{item.remark || '-'}</td>
                            <td className="px-5 py-4 text-slate-600">{item.adminMessage || '-'}</td>
                            <td className="px-5 py-4">
                              <a
                                className="text-blue-600 hover:underline"
                                href={item.receiptImage}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View receipt
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 p-4 lg:hidden">
                    {recharges.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {item.paymentMethod?.network || 'Deleted Method'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatSellerDate(item.createdAt)}
                            </div>
                          </div>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              statusBadgeClass(item.status)
                            )}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-slate-700">
                          <div>
                            Amount:{' '}
                            <span className="font-semibold">{formatSellerMoney(item.amount)}</span>
                          </div>
                          <div className="mt-1">
                            Credited:{' '}
                            <span className="font-semibold">
                              {item.approvedAmount ? formatSellerMoney(item.approvedAmount) : '-'}
                            </span>
                          </div>
                          <div className="mt-1">Remark: {item.remark || '-'}</div>
                          <div className="mt-1">Admin note: {item.adminMessage || '-'}</div>
                          <a
                            className="mt-2 inline-block text-blue-600 hover:underline text-xs font-medium"
                            href={item.receiptImage}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View receipt
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* WITHDRAWAL DIALOG */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-slate-200 bg-white p-0 sm:max-w-xl">
          <DialogHeader className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                Withdraw Funds
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWithdrawOpen(false)}
                className="text-slate-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            {/* Current Balance Banner */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-medium">Available Balance</div>
                <div className="text-xl font-bold text-slate-900">
                  {formatSellerMoney(balances?.walletMoney)}
                </div>
              </div>
              <Wallet className="h-8 w-8 text-emerald-600 opacity-80" />
            </div>

            {pendingWithdrawal ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                You already have a pending withdrawal request of {formatSellerMoney(pendingWithdrawal.amount)} submitted on {formatSellerDate(pendingWithdrawal.createdAt)}. Please wait for admin review.
              </div>
            ) : null}

            {/* 1. Payment Network */}
            {paymentMethods.length > 0 ? (
              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                  1. Payment Network
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {paymentMethods.map((method) => {
                    const active = selectedWithdrawMethodId === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedWithdrawMethodId(method.id)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all',
                          active
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {method.logo ? (
                          <img
                            src={method.logo}
                            alt={method.network}
                            className="h-6 w-6 object-contain rounded-md"
                          />
                        ) : null}
                        <div>
                          <div className="text-xs font-bold text-slate-900">{method.network}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* 2. Payout Address */}
            <div>
              <Label htmlFor="payout-address" className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                2. Payout Wallet / Account Address *
              </Label>
              <Input
                id="payout-address"
                placeholder="Enter your crypto wallet address (e.g. TRC20 / ETH address)"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="border-slate-200 font-mono text-sm"
              />
            </div>

            {/* 3. Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="withdraw-amount" className="text-xs font-semibold uppercase text-slate-500">
                  3. Withdrawal Amount ($) *
                </Label>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(balances?.walletMoney || 0))}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Use Max Balance
                </button>
              </div>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="border-slate-200 font-semibold text-slate-900"
              />
            </div>

            {/* 4. Transaction Password */}
            <div>
              <Label htmlFor="tx-password" className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                4. Transaction Password *
              </Label>
              <Input
                id="tx-password"
                type="password"
                placeholder="Enter your 6-digit transaction password"
                value={transactionPassword}
                onChange={(e) => setTransactionPassword(e.target.value)}
                className="border-slate-200"
              />
            </div>

            {/* 5. Remark */}
            <div>
              <Label htmlFor="withdraw-remark" className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                5. Remark (Optional)
              </Label>
              <Textarea
                id="withdraw-remark"
                placeholder="Add any extra note for the admin..."
                value={withdrawRemark}
                onChange={(e) => setWithdrawRemark(e.target.value)}
                rows={2}
                className="border-slate-200 text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsWithdrawOpen(false)}
                className="border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={submitWithdrawal}
                disabled={
                  submitWithdrawalMutation.isPending ||
                  !!pendingWithdrawal ||
                  balances?.allowWithdraw === false
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitWithdrawalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Withdrawal Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RECHARGE DIALOG */}
      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-slate-200 bg-white p-0 sm:max-w-4xl">
          <DialogHeader className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Recharge Wallet
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRechargeOpen(false)}
                className="text-slate-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 px-5 py-5 sm:px-6">
            {pendingRecharge ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                Your recharge request from {formatSellerDate(pendingRecharge.createdAt)} is still
                pending admin review.
              </div>
            ) : null}

            <div>
              <div className="mb-3 text-sm font-medium text-slate-700">
                1. Select Payment Network
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paymentMethods.map((method) => {
                  const active = selectedPaymentMethodId === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethodId(method.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                        active
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {method.logo ? (
                        <img
                          src={method.logo}
                          alt={method.network}
                          className="h-8 w-8 object-contain"
                        />
                      ) : null}
                      <div>
                        <div className="font-semibold text-slate-900">{method.network}</div>
                        <div className="text-xs text-slate-500">Official Gateway</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRechargeMethod ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase">
                  2. Deposit Address ({selectedRechargeMethod.network})
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 break-all">
                  <span>{selectedRechargeMethod.address}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAddress(selectedRechargeMethod.address)}
                    className="ml-2 shrink-0 h-8"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}

            <div>
              <Label htmlFor="recharge-amount" className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                3. Amount ($) *
              </Label>
              <Input
                id="recharge-amount"
                type="number"
                min="1"
                placeholder="Enter deposit amount"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="border-slate-200"
              />
            </div>

            <div>
              <Label htmlFor="recharge-receipt" className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                4. Upload Receipt / Proof of Payment *
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onReceiptSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:bg-slate-100 transition-colors"
              >
                <ImagePlus className="h-8 w-8 text-slate-400 mb-2" />
                <div className="text-xs font-medium text-slate-700">
                  {receiptFileName ? receiptFileName : 'Click to select payment receipt screenshot'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">PNG, JPG up to 5MB</div>
              </div>
            </div>

            <div>
              <Label htmlFor="recharge-remark" className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                5. Remark (Optional)
              </Label>
              <Textarea
                id="recharge-remark"
                placeholder="TxHash, reference note..."
                value={rechargeRemark}
                onChange={(e) => setRechargeRemark(e.target.value)}
                rows={2}
                className="border-slate-200 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsRechargeOpen(false)}
                className="border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRecharge}
                disabled={
                  submitRechargeMutation.isPending ||
                  !selectedPaymentMethodId ||
                  !rechargeAmount ||
                  !receiptBase64 ||
                  !!pendingRecharge
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitRechargeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Recharge Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Frozen Orders Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">Frozen Orders</CardTitle>
          {ordersQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {frozenOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No frozen orders.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-medium">Order ID</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Profit</th>
                      <th className="px-5 py-3 font-medium">Payment Status</th>
                      <th className="px-5 py-3 font-medium">Delivery Status</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Unfreeze Countdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frozenOrders.map((order) => (
                      <tr key={order.id} className="border-t border-slate-100 align-top">
                        <td className="px-5 py-4 font-mono text-sm text-slate-900">{order.code}</td>
                        <td className="px-5 py-4 text-slate-900 font-semibold">
                          {formatSellerMoney(order.amount)}
                        </td>
                        <td className="px-5 py-4 text-slate-900">
                          {formatSellerMoney(order.profit)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-slate-600 text-xs">Paid</span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              getStatusBadgeClass(order.status)
                            )}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatSellerDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <UnfreezeCountdown orderDate={order.createdAt} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {frozenOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{order.code}</div>
                        <div className="text-xs text-slate-500">
                          {formatSellerDate(order.createdAt)}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                          getStatusBadgeClass(order.status)
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-700">
                      <div>
                        Amount:{' '}
                        <span className="font-semibold">{formatSellerMoney(order.amount)}</span>
                      </div>
                      <div className="mt-1">
                        Profit:{' '}
                        <span className="font-semibold">{formatSellerMoney(order.profit)}</span>
                      </div>
                      <div className="mt-1">
                        Unfreeze Countdown: <UnfreezeCountdown orderDate={order.createdAt} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'blue' | 'orange' | 'violet';
  action?: React.ReactNode;
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-100 text-blue-600'
      : tone === 'orange'
        ? 'bg-orange-100 text-orange-600'
        : 'bg-violet-100 text-violet-600';

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('grid h-10 w-10 place-items-center rounded-lg', toneClass)}>{icon}</div>
        <div>
          <div className="text-lg font-semibold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function getStatusBadgeClass(status: SellerOrder['status']): string {
  if (status === 'PICKED_UP') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (status === 'ON_THE_WAY') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'DELIVERED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'CANCELLED') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'SHIPPED') return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function getStatusLabel(status: SellerOrder['status']): string {
  if (status === 'PICKED_UP') return 'Picked Up';
  if (status === 'ON_THE_WAY') return 'On The Way';
  if (status === 'DELIVERED') return 'Delivered';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'SHIPPED') return 'Shipped';
  return status;
}

function UnfreezeCountdown({ orderDate }: { orderDate: string }) {
  const [remainingTime, setRemainingTime] = React.useState<string>('');

  React.useEffect(() => {
    const calculateCountdown = () => {
      const orderDateTime = new Date(orderDate).getTime();
      const unfreezeDateTime = orderDateTime + 7 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const difference = unfreezeDateTime - now;

      if (difference <= 0) {
        setRemainingTime('Unfrozen');
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setRemainingTime(`${days}d ${hours}h ${minutes}m`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000);

    return () => clearInterval(interval);
  }, [orderDate]);

  return (
    <div className="flex items-center gap-1">
      <Clock className="h-3.5 w-3.5 text-slate-400" />
      <span
        className={cn(
          'text-xs font-medium',
          remainingTime === 'Unfrozen' ? 'text-emerald-600' : 'text-slate-600'
        )}
      >
        {remainingTime || 'Calculating...'}
      </span>
    </div>
  );
}
