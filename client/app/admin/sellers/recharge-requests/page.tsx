'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RefreshCcw, Search, Trash2, XCircle } from 'lucide-react';
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

type RechargeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type PaymentNetwork = 'TRC20' | 'ETH' | 'BTC' | 'BSC' | 'SOL';

interface SellerWalletRecharge {
  id: string;
  amount: number | string;
  approvedAmount: number | string | null;
  receiptImage: string;
  remark: string | null;
  status: RechargeStatus;
  adminMessage: string | null;
  resolvedAt: string | null;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    email: string;
    shopName: string;
    walletMoney: number | string;
  };
  paymentMethod: {
    id: string;
    network: PaymentNetwork;
    logo: string;
    address: string;
  } | null;
}

const EMPTY_RECHARGES: SellerWalletRecharge[] = [];

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

function statusBadgeClass(status: RechargeStatus) {
  if (status === 'APPROVED') return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (status === 'REJECTED') return 'bg-red-500/10 text-red-400 border-red-500/20';
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
}

export default function AdminSellerRechargeRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<RechargeStatus | 'ALL'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [approving, setApproving] = useState<SellerWalletRecharge | null>(null);
  const [rejecting, setRejecting] = useState<SellerWalletRecharge | null>(null);
  const [deleting, setDeleting] = useState<SellerWalletRecharge | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  const rechargesQuery = useQuery({
    queryKey: ['admin', 'seller-wallet-recharges'],
    queryFn: () => apiClient.get<{ data: SellerWalletRecharge[] }>('/api/admin/seller-wallet-recharges'),
  });

  const recharges = rechargesQuery.data?.data ?? EMPTY_RECHARGES;

  const filteredRecharges = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return recharges.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSearch =
        !search ||
        item.seller.name.toLowerCase().includes(search) ||
        item.seller.email.toLowerCase().includes(search) ||
        item.seller.shopName.toLowerCase().includes(search) ||
        (item.paymentMethod?.network.toLowerCase().includes(search) ?? false);

      return matchesStatus && matchesSearch;
    });
  }, [recharges, searchTerm, statusFilter]);

  const pendingCount = recharges.filter((item) => item.status === 'PENDING').length;

  const approveMutation = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      apiClient.post(`/api/admin/seller-wallet-recharges/${id}/approve`, {
        approvedAmount: amount,
        adminMessage: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Recharge request approved and wallet funded');
      setApproving(null);
      setApprovedAmount('');
      setAdminMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'seller-wallet-recharges'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to approve recharge request'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      apiClient.post(`/api/admin/seller-wallet-recharges/${id}/reject`, {
        adminMessage: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Recharge request rejected');
      setRejecting(null);
      setAdminMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'seller-wallet-recharges'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to reject recharge request'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/seller-wallet-recharges/${id}`),
    onSuccess: () => {
      toast.success('Recharge request deleted');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'seller-wallet-recharges'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete recharge request'));
    },
  });

  const openApproveDialog = (request: SellerWalletRecharge) => {
    setApproving(request);
    setApprovedAmount(String(Number(request.amount || 0)));
    setAdminMessage('');
  };

  const openRejectDialog = (request: SellerWalletRecharge) => {
    setRejecting(request);
    setAdminMessage('');
  };

  const submitApproval = () => {
    if (!approving) return;

    const amount = Number(approvedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount to add');
      return;
    }

    approveMutation.mutate({ id: approving.id, amount, note: adminMessage });
  };

  const submitRejection = () => {
    if (!rejecting) return;
    rejectMutation.mutate({ id: rejecting.id, note: adminMessage });
  };

  const openDeleteDialog = (request: SellerWalletRecharge) => {
    setDeleting(request);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Recharge Requests</h1>
          <p className="text-slate-400">
            Review seller wallet deposits, approve funding, or reject invalid receipts.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full border-white/10 hover:bg-white/5 md:w-auto"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'seller-wallet-recharges'] })}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by seller, email, shop, or network..."
            className="border-white/10 bg-[#1a1c2e] pl-9 text-slate-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RechargeStatus | 'ALL')}>
          <SelectTrigger className="border-white/10 bg-[#1a1c2e] text-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1a1c2e] text-slate-300">
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-lg border border-white/10 bg-[#1a1c2e] px-4 py-2 text-sm text-slate-300">
          Pending: <span className="font-mono font-bold text-amber-400">{pendingCount}</span>
        </div>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-xl border border-white/10 bg-[#1a1c2e]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="min-w-[220px] text-slate-300">Seller</TableHead>
              <TableHead className="text-slate-300">Network</TableHead>
              <TableHead className="text-slate-300">Requested</TableHead>
              <TableHead className="text-slate-300">Credited</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="min-w-[170px] text-slate-300">Submitted</TableHead>
              <TableHead className="text-slate-300">Receipt</TableHead>
              <TableHead className="min-w-[220px] text-slate-300">Notes</TableHead>
              <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rechargesQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    <span>Loading recharge requests...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRecharges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20 text-center text-slate-500">
                  No recharge requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecharges.map((item) => (
                <TableRow key={item.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="py-4">
                    <div className="font-semibold text-slate-200">{item.seller.shopName}</div>
                    <div className="text-xs text-slate-500">{item.seller.name}</div>
                    <div className="text-xs text-slate-500">{item.seller.email}</div>
                    <div className="mt-1 text-xs text-green-400">
                      Wallet: {formatMoney(item.seller.walletMoney)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-300">{item.paymentMethod?.network || 'Deleted Method'}</TableCell>
                  <TableCell className="font-mono text-slate-200">{formatMoney(item.amount)}</TableCell>
                  <TableCell className="font-mono text-slate-200">
                    {item.approvedAmount ? formatMoney(item.approvedAmount) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('border', statusBadgeClass(item.status))}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{formatDate(item.createdAt)}</TableCell>
                  <TableCell>
                    <a
                      href={item.receiptImage}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-400 hover:underline"
                    >
                      View receipt
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    <div>Seller: {item.remark || '-'}</div>
                    <div className="mt-1">Admin: {item.adminMessage || '-'}</div>
                    {item.resolvedAt ? (
                      <div className="mt-1 text-xs text-slate-500">Resolved: {formatDate(item.resolvedAt)}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={item.status !== 'PENDING'}
                        onClick={() => openApproveDialog(item)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={item.status !== 'PENDING'}
                        onClick={() => openRejectDialog(item)}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        disabled={deleteMutation.isPending}
                        onClick={() => openDeleteDialog(item)}
                        title="Delete request"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!approving} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent className="border-white/10 bg-[#1a1c2e] text-slate-300">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Approve recharge request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add funds to {approving?.seller.shopName || 'this seller'} and mark this request approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-white/10 bg-[#111322] p-3 text-sm">
              Requested amount: <span className="font-mono font-bold text-slate-100">{formatMoney(approving?.amount)}</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="approved-amount">Funds to add</Label>
              <Input
                id="approved-amount"
                type="number"
                min="0"
                step="0.01"
                value={approvedAmount}
                onChange={(event) => setApprovedAmount(event.target.value)}
                className="border-white/10 bg-[#111322] text-slate-200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="approve-note">Admin note</Label>
              <Textarea
                id="approve-note"
                value={adminMessage}
                onChange={(event) => setAdminMessage(event.target.value)}
                className="border-white/10 bg-[#111322] text-slate-200"
                placeholder="Optional note shown in seller history"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setApproving(null)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={approveMutation.isPending} onClick={submitApproval}>
              {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve and Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="border-white/10 bg-[#1a1c2e] text-slate-300">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Reject recharge request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Mark this request rejected. No funds will be added to the seller wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="reject-note">Admin note</Label>
            <Textarea
              id="reject-note"
              value={adminMessage}
              onChange={(event) => setAdminMessage(event.target.value)}
              className="border-white/10 bg-[#111322] text-slate-200"
              placeholder="Optional reason shown in seller history"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={rejectMutation.isPending} onClick={submitRejection}>
              {rejectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="border-white/10 bg-[#1a1c2e] text-slate-300">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Delete recharge request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete the recharge request from{' '}
              <span className="font-semibold text-slate-200">{deleting?.seller.shopName}</span> for{' '}
              <span className="font-mono font-bold text-slate-200">{formatMoney(deleting?.amount)}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={confirmDelete}>
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
