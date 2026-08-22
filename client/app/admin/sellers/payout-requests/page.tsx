'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Loader2, RefreshCcw, Search, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface SellerWalletWithdrawal {
  id: string;
  amount: number | string;
  payoutAddress: string;
  remark: string | null;
  status: WithdrawalStatus;
  adminMessage: string | null;
  resolvedAt: string | null;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    email: string;
    shopName: string;
  };
  paymentMethod?: {
    id: string;
    network: string;
    logo: string;
    address: string;
  } | null;
}

const EMPTY_WITHDRAWALS: SellerWalletWithdrawal[] = [];

function getErrorMessage(error: unknown, fallback: string) {
  const data = (error as { data?: { error?: string; message?: string } })?.data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatMoney(value: number | string | null | undefined) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadgeClass(status: WithdrawalStatus) {
  if (status === 'APPROVED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'REJECTED') return 'bg-red-500/10 text-red-400 border-red-500/20';
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
}

export default function PayoutRequestsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<SellerWalletWithdrawal | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminMessage, setAdminMessage] = useState('');

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin', 'seller-wallet-withdrawals'],
    queryFn: () => apiClient.get<{ data: SellerWalletWithdrawal[] }>('/api/admin/seller-wallet-withdrawals'),
  });

  const withdrawals = data?.data ?? EMPTY_WITHDRAWALS;

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payoutAddress.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, searchTerm, statusFilter]);

  const approveMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      apiClient.post(`/api/admin/seller-wallet-withdrawals/${id}/approve`, {
        adminMessage: message,
      }),
    onSuccess: () => {
      toast.success('Withdrawal request approved successfully');
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['admin', 'seller-wallet-withdrawals'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to approve withdrawal request'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      apiClient.post(`/api/admin/seller-wallet-withdrawals/${id}/reject`, {
        adminMessage: message,
      }),
    onSuccess: () => {
      toast.success('Withdrawal request rejected and funds refunded to seller');
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['admin', 'seller-wallet-withdrawals'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to reject withdrawal request'));
    },
  });

  const openActionDialog = (item: SellerWalletWithdrawal, type: 'approve' | 'reject') => {
    setSelectedWithdrawal(item);
    setActionType(type);
    setAdminMessage('');
  };

  const closeDialog = () => {
    setSelectedWithdrawal(null);
    setActionType(null);
    setAdminMessage('');
  };

  const handleConfirmAction = () => {
    if (!selectedWithdrawal || !actionType) return;
    if (actionType === 'approve') {
      approveMutation.mutate({ id: selectedWithdrawal.id, message: adminMessage });
    } else {
      rejectMutation.mutate({ id: selectedWithdrawal.id, message: adminMessage });
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Banknote className="h-6 w-6 text-emerald-400" />
            Seller Payout / Withdrawal Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review and approve seller withdrawal requests to external crypto wallets or bank accounts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 self-start sm:self-auto"
        >
          <RefreshCcw className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search seller, shop name, or payout address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-slate-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val: string | null) => setStatusFilter(val || 'all')}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-800 text-slate-200">
            <SelectValue placeholder="Status Filter" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading withdrawal requests...
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400 p-4 text-center">
            <Banknote className="h-10 w-10 text-slate-600 mb-2" />
            <p className="font-semibold">No withdrawal requests found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Sellers have not submitted any withdrawal requests yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Seller</TableHead>
                  <TableHead className="text-slate-400">Network</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Payout Address</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((item) => (
                  <TableRow key={item.id} className="border-slate-800/60 hover:bg-slate-800/40">
                    <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-200 text-sm">{item.seller.shopName}</div>
                      <div className="text-xs text-slate-400">{item.seller.email}</div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-300">
                      {item.paymentMethod?.network || 'USDT / CRYPTO'}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-400 text-sm">
                      {formatMoney(item.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 max-w-[220px] truncate">
                        <span className="truncate">{item.payoutAddress}</span>
                        <button
                          type="button"
                          onClick={() => copyText(item.payoutAddress)}
                          className="text-slate-400 hover:text-slate-200 shrink-0"
                          title="Copy address"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('capitalize text-xs', statusBadgeClass(item.status))}>
                        {item.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                            onClick={() => openActionDialog(item, 'approve')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-rose-600/80 text-white hover:bg-rose-600 text-xs h-8"
                            onClick={() => openActionDialog(item, 'reject')}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {formatDate(item.resolvedAt)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Approve Withdrawal Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-400" />
                  Reject Withdrawal Request
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              {actionType === 'approve'
                ? `Confirm payout of ${formatMoney(selectedWithdrawal?.amount)} to ${selectedWithdrawal?.seller.shopName}.`
                : `Reject payout of ${formatMoney(selectedWithdrawal?.amount)}. The funds will be automatically refunded back to the seller's wallet balance.`}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-slate-950 p-3 text-xs space-y-1.5 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Seller:</span>
                  <span className="font-semibold text-slate-200">{selectedWithdrawal.seller.shopName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-bold text-emerald-400">{formatMoney(selectedWithdrawal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network:</span>
                  <span className="text-slate-200">{selectedWithdrawal.paymentMethod?.network || 'USDT'}</span>
                </div>
                <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Payout Address:</span>
                  <span className="font-mono text-slate-300 break-all">{selectedWithdrawal.payoutAddress}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="admin-note" className="text-xs font-semibold text-slate-400">
                  Admin Note / Transaction Hash (Optional)
                </Label>
                <Textarea
                  id="admin-note"
                  placeholder={
                    actionType === 'approve'
                      ? 'Enter blockchain transaction hash or reference notes...'
                      : 'Reason for rejection...'
                  }
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="mt-1.5 bg-slate-950 border-slate-800 text-slate-200 text-xs"
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDialog} className="border-slate-800 text-black">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className={cn(
                actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              )}
            >
              {approveMutation.isPending || rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : actionType === 'approve' ? (
                'Confirm Approval'
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
