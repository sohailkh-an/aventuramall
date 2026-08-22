"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  RefreshCcw,
  Store,
  ShieldCheck,
  Ban,
  Wallet,
  Package as PackageIcon,
  MoreHorizontal,
  Info,
  LogIn,
  Trash2,
  Download,
  Copy,
  Check,
  Key
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export type ShopStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED' | 'UNVERIFIED' | string;

export interface SellerPackage {
  id: string;
  code?: string;
  name: string;
  price?: number | string | any;
  productLimit?: number;
  profitPercent?: number;
  [key: string]: any;
}

export interface SellerWithStats {
  id: string;
  name?: string;
  email: string;
  shopName: string;
  shopLogo?: string | null;
  shopDescription?: string | null;
  status: ShopStatus;
  isVerified?: boolean;
  walletBalance?: number | string;
  guaranteeBalance?: number | string;
  totalSales?: number | string;
  totalOrders?: number;
  productsCount?: number;
  sellerPackage?: SellerPackage | null;
  sellerPackageId?: string | null;
  allowWithdraw?: boolean;
  createdAt: string | Date;
  [key: string]: any;
}

import Image from 'next/image';


const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

type BalanceMode = 'add' | 'deduct';
type BalanceType = 'wallet' | 'guarantee';

const formatMoney = (value: number | string) =>
  `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SellerListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSeller, setSelectedSeller] = useState<SellerWithStats | null>(null);
  const [sellerToVerify, setSellerToVerify] = useState<SellerWithStats | null>(null);
  const [sellerToBan, setSellerToBan] = useState<SellerWithStats | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<SellerWithStats | null>(null);
  const [sellerToSettle, setSellerToSettle] = useState<SellerWithStats | null>(null);
  const [sellerForBalance, setSellerForBalance] = useState<SellerWithStats | null>(null);
  const [sellerForPackage, setSellerForPackage] = useState<SellerWithStats | null>(null);
  const [sellerForPassword, setSellerForPassword] = useState<SellerWithStats | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [balanceType, setBalanceType] = useState<BalanceType>('wallet');
  const [balanceMode, setBalanceMode] = useState<BalanceMode>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null);

  // Fetch Sellers
  const { data: sellersData, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['admin', 'sellers'],
    queryFn: () => apiClient.get<{ data: SellerWithStats[] }>('/api/admin/sellers'),
  });

  const { data: packagesData } = useQuery({
    queryKey: ['admin', 'seller-packages'],
    queryFn: () => apiClient.get<{ data: SellerPackage[] }>('/api/admin/seller-packages'),
  });

  const sellers = sellersData?.data || [];
  const sellerPackages = packagesData?.data || [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ShopStatus }) =>
      apiClient.patch(`/api/admin/sellers/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      toast.success('Seller verification status updated');
      setSellerToBan(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update status'));
    }
  });

  const toggleWithdrawMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/admin/sellers/${id}/allow-withdraw`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      toast.success('Withdrawal permission updated');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update withdrawal permission'));
    }
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, packageId }: { id: string; packageId: string }) =>
      apiClient.patch(`/api/admin/sellers/${id}/package`, { packageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      toast.success('Seller package updated');
      setSellerForPackage(null);
      setSelectedPackageId('');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update seller package'));
    }
  });

  const deleteSellerMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/sellers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      toast.success('Seller deleted');
      setSellerToDelete(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete seller'));
    }
  });

  const updateBalanceMutation = useMutation({
    mutationFn: ({ id, type, mode, amount }: { id: string; type: BalanceType; mode: BalanceMode; amount: number }) =>
      apiClient.patch(`/api/admin/sellers/${id}/balance`, { type, mode, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      toast.success('Seller balance updated');
      setSellerForBalance(null);
      setBalanceType('wallet');
      setBalanceMode('add');
      setBalanceAmount('');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update seller balance'));
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiClient.patch(`/api/admin/sellers/${id}/password`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      toast.success('Seller password updated successfully');
      setSellerForPassword(null);
      setNewPassword('');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update seller password'));
    }
  });

  const settlePendingMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/admin/sellers/${id}/settle-pending`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      toast.success('Pending balance settled successfully');
      setSellerToSettle(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to settle pending balance'));
    }
  });

  const impersonateSellerMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{
        token: string;
        seller: { id: string; email: string; name: string; shopName: string };
      }>(`/api/admin/sellers/${id}/impersonate`, {}),
    onSuccess: ({ token, seller }) => {
      const existingToken = localStorage.getItem('seller_auth_token');
      if (existingToken && existingToken !== token) {
        localStorage.setItem('seller_impersonation_previous_auth_token', existingToken);
      }

      localStorage.setItem('seller_auth_token', token);
      toast.success(`Logged in as ${seller.shopName}`);
      window.location.href = '/seller/dashboard';
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to login as seller'));
    },
  });

  const filteredSellers = sellers.filter(s => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s as any).phone?.toLowerCase().includes(searchTerm.toLowerCase());


    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatJoinedDate = (date: Date | string) => {
    const value = new Date(date);
    return `${value.getDate()} ${value.toLocaleDateString('en-US', { month: 'short' })}`;
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Image downloaded successfully');
    } catch {
      toast.error('Failed to download image');
    }
  };

  const copyImageUrl = (url: string, imageId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedImageId(imageId);
    toast.success('Image URL copied to clipboard');
    setTimeout(() => setCopiedImageId(null), 2000);
  };

  const getStatusBadge = (status: ShopStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Verified</Badge>;
      case 'PENDING':
        return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="border-rose-200 bg-rose-50 text-rose-700">Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge className="border-slate-300 bg-slate-100 text-slate-700">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openPackageDialog = (seller: SellerWithStats) => {
    setSellerForPackage(seller);
    setSelectedPackageId(seller.sellerPackageId || '');
  };

  const openBalanceDialog = (seller: SellerWithStats, type: BalanceType = 'wallet') => {
    setSellerForBalance(seller);
    setBalanceType(type);
    setBalanceMode('add');
    setBalanceAmount('');
  };

  const parsedBalanceAmount = Number(balanceAmount);
  const currentTargetBalance = Number(
    balanceType === 'wallet' ? (sellerForBalance?.walletMoney || 0) : (sellerForBalance?.guaranteeMoney || 0)
  );
  const projectedTargetBalance =
    balanceMode === 'add'
      ? currentTargetBalance + (Number.isFinite(parsedBalanceAmount) ? parsedBalanceAmount : 0)
      : currentTargetBalance - (Number.isFinite(parsedBalanceAmount) ? parsedBalanceAmount : 0);
  const canSubmitBalance =
    Boolean(sellerForBalance) &&
    Number.isFinite(parsedBalanceAmount) &&
    parsedBalanceAmount > 0 &&
    (balanceMode === 'add' || parsedBalanceAmount <= currentTargetBalance);

  const sellerCounts = {
    total: sellers.length,
    approved: sellers.filter((seller) => seller.status === 'APPROVED').length,
    pending: sellers.filter((seller) => seller.status === 'PENDING').length,
    suspended: sellers.filter((seller) => seller.status === 'SUSPENDED').length,
  };

  const sellerActions = (seller: SellerWithStats) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:cursor-pointer hover:border-slate-300 hover:text-slate-950" aria-label={`Actions for ${seller.shopName}`}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-slate-200 bg-white text-slate-700 shadow-xl duration-0 data-closed:animate-none data-open:animate-none">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-slate-400">Seller operations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={impersonateSellerMutation.isPending} onClick={() => impersonateSellerMutation.mutate(seller.id)}><LogIn className="mr-2 h-4 w-4" />Login as seller</DropdownMenuItem>
        <DropdownMenuItem onClick={() => openPackageDialog(seller)}><PackageIcon className="mr-2 h-4 w-4" />Change package</DropdownMenuItem>
        <DropdownMenuItem onClick={() => openBalanceDialog(seller, 'wallet')}><Wallet className="mr-2 h-4 w-4" />Update wallet</DropdownMenuItem>
        <DropdownMenuItem onClick={() => openBalanceDialog(seller, 'guarantee')}><ShieldCheck className="mr-2 h-4 w-4" />Update guarantee</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSellerForPassword(seller)}><Key className="mr-2 h-4 w-4" />Change password</DropdownMenuItem>
        <DropdownMenuItem className="text-blue-700" onClick={() => setSellerToSettle(seller)} disabled={Number(seller.pendingBalance) <= 0}><Check className="mr-2 h-4 w-4" />Settle pending</DropdownMenuItem>
        <DropdownMenuItem disabled={toggleWithdrawMutation.isPending} onClick={() => toggleWithdrawMutation.mutate(seller.id)}>
          {seller.allowWithdraw ? <Ban className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
          {seller.allowWithdraw ? 'Block withdrawals' : 'Enable withdrawals'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-amber-700" disabled={seller.status === 'SUSPENDED' || updateStatusMutation.isPending} onClick={() => setSellerToBan(seller)}><Ban className="mr-2 h-4 w-4" />Suspend seller</DropdownMenuItem>
        <DropdownMenuItem className="text-rose-700" disabled={deleteSellerMutation.isPending} onClick={() => setSellerToDelete(seller)}><Trash2 className="mr-2 h-4 w-4" />Delete seller</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-full space-y-6 text-slate-950">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700"><Store className="h-4 w-4" /> Marketplace network</div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Sellers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review storefront health, verification, packages, and financial access.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          <Button
            variant="outline"
            className="h-10 w-full rounded-xl border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 text-[var(--admin-text)] shadow-sm hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-hover)] sm:w-auto"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] })}
          >
            <RefreshCcw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} /> Refresh
          </Button>
          <div className="flex h-10 min-w-0 flex-1 items-center divide-x divide-[var(--admin-border)] overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] shadow-sm sm:flex-none">
            {[['All', sellerCounts.total], ['Approved', sellerCounts.approved], ['Review', sellerCounts.pending], ['Suspended', sellerCounts.suspended]].map(([label, value]) => (
              <div key={String(label)} className="flex h-full min-w-[4.65rem] flex-1 items-center justify-center gap-1.5 px-2.5 sm:flex-none">
                <span className="truncate text-[10px] font-bold uppercase tracking-wide text-[var(--admin-text-muted)]">{label}</span>
                <span className="text-base font-black leading-none tabular-nums text-[var(--admin-text)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_10rem]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name, email, shop or phone..."
            className="h-11 border-slate-200 bg-white pl-9 text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'ALL')}>
          <SelectTrigger className="h-11 min-h-11 w-full border-slate-200 bg-white text-slate-900">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 bg-white text-slate-700">
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:hidden">
        {isLoading ? <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500">Loading sellers…</div> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">Sellers could not be loaded.<Button variant="outline" className="mt-4 w-full" onClick={() => refetch()}>Try again</Button></div> : filteredSellers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No sellers match these filters.</div> : filteredSellers.map((seller) => (
          <article key={seller.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
              <div className="min-w-0"><h2 className="truncate font-black text-slate-950">{seller.shopName}</h2><p className="truncate text-sm text-slate-600">{seller.name}</p><p className="truncate text-xs text-slate-400">{seller.email}</p></div>
              {getStatusBadge(seller.status)}
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-100"><div className="bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Package</p><p className="mt-1 font-black text-slate-900">{seller.sellerPackage?.name || 'None'}</p><p className="text-xs text-slate-500">{seller.productCount} products</p></div><div className="bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Joined</p><p className="mt-1 font-black text-slate-900">{formatJoinedDate(seller.createdAt)}</p></div></div>
            <div className="grid grid-cols-3 border-t border-slate-100 p-4 text-sm"><div><p className="text-xs text-slate-400">Wallet</p><p className="font-black text-emerald-700">{formatMoney(seller.walletMoney)}</p></div><div><p className="text-xs text-slate-400">Pending</p><p className="font-black text-amber-700">{formatMoney(seller.pendingBalance)}</p></div><div className="flex justify-end">{sellerActions(seller)}</div></div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-slate-50">
              <TableHead className="min-w-[230px] text-slate-600">Seller</TableHead>
              <TableHead className="text-slate-600">Package</TableHead>
              <TableHead className="text-slate-600">Status</TableHead>
              <TableHead className="text-slate-600">Products</TableHead>
              <TableHead className="min-w-[210px] text-slate-600">Balances</TableHead>
              <TableHead className="text-slate-600">Joined</TableHead>
              <TableHead className="text-right text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading sellers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center text-slate-500">
                  No sellers found matching your criteria.
                </TableCell>
              </TableRow>
            ) : filteredSellers.map((seller) => (
              <TableRow key={seller.id} className="border-slate-100 transition-colors hover:bg-slate-50/5 has-aria-expanded:bg-slate-50/5">
                <TableCell className="py-4">
                  <div className="flex flex-col">
                      <span className="font-black text-slate-950">{seller.shopName}</span>
                      <span className="text-sm text-slate-600">{seller.name}</span>
                      <span className="max-w-[190px] truncate text-xs text-slate-400">{seller.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge className="w-fit border-blue-200 bg-blue-50 text-blue-700">
                      {seller.sellerPackage?.name || 'No Package'}
                    </Badge>
                    {seller.sellerPackage && (
                      <span className="text-[10px] text-slate-500">
                        {Number(seller.sellerPackage.productLimit || 0).toLocaleString()} products, {Number(seller.sellerPackage.profitPercent || 0)}% profit
                      </span>
                    )}

                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={seller.status === 'APPROVED'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSellerToVerify(seller);
                            return;
                          }

                          updateStatusMutation.mutate({
                            id: seller.id,
                            status: 'PENDING'
                          });
                        }}
                      />
                      <span className="text-xs font-medium text-slate-500">{seller.status === 'APPROVED' ? 'Verified' : 'Needs review'}</span>
                    </div>
                    <button type="button" className="text-xs font-bold text-blue-700 hover:underline" onClick={() => setSelectedSeller(seller)}>View {seller.idType.replace('_', ' ')}</button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <PackageIcon className="h-4 w-4 text-slate-500" />
                    {seller.productCount}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5 py-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Pending:</span>
                      <span className="font-mono text-xs font-bold text-amber-700">{formatMoney(seller.pendingBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Wallet:</span>
                      <span className="font-mono text-xs font-bold text-emerald-700">{formatMoney(seller.walletMoney)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Guarantee:</span>
                      <span className="font-mono text-xs font-bold text-blue-700">{formatMoney(seller.guaranteeMoney)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-600">{formatJoinedDate(seller.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {sellerActions(seller)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Verification Details Dialog */}
      <Dialog open={!!selectedSeller} onOpenChange={() => setSelectedSeller(null)}>
        <DialogContent className="grid h-[92vh] max-h-[92vh] w-[calc(100vw-1rem)] max-w-[min(1320px,calc(100vw-1rem))] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-700 shadow-2xl sm:w-[calc(100vw-2rem)] sm:max-w-[min(1320px,calc(100vw-2rem))]">
          <DialogHeader className="border-b border-slate-200 px-5 py-4 pr-12">
            <DialogTitle className="flex items-center gap-2 text-slate-950">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              Verification Details — {selectedSeller?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="grid min-h-full grid-cols-1 gap-4 xl:grid-cols-2">
              {/* Front Side */}
              <div className="flex min-h-0 flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Front Side ({selectedSeller?.idType})</h3>
                </div>
                <div className="group relative flex min-h-[68vh] flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 xl:min-h-[calc(92vh-13.5rem)]">
                  <div className="relative flex min-h-full w-full items-center justify-center">
                    {selectedSeller?.idFrontImage ? (
                      <Image
                        src={selectedSeller.idFrontImage}
                        alt="ID Front"
                        fill
                        sizes="(max-width: 1280px) 94vw, 620px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
                        <Info className="h-8 w-8" />
                        <span className="text-xs">No image available</span>
                      </div>
                    )}
                  </div>
                  {selectedSeller?.idFrontImage && (
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 to-transparent p-4 transition-transform duration-200 group-hover:translate-y-0 sm:flex-row sm:justify-end sm:translate-y-full">
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 sm:w-36"
                        onClick={() => downloadImage(selectedSeller.idFrontImage, `${selectedSeller.id}-id-front.jpg`)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-slate-700 hover:bg-slate-600 sm:w-36"
                        onClick={() => copyImageUrl(selectedSeller.idFrontImage, `front-${selectedSeller.id}`)}
                      >
                        {copiedImageId === `front-${selectedSeller.id}` ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Side */}
              <div className="flex min-h-0 flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Back Side</h3>
                </div>
                <div className="group relative flex min-h-[68vh] flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 xl:min-h-[calc(92vh-13.5rem)]">
                  <div className="relative flex min-h-full w-full items-center justify-center">
                    {selectedSeller?.idBackImage ? (
                      <Image
                        src={selectedSeller.idBackImage}
                        alt="ID Back"
                        fill
                        sizes="(max-width: 1280px) 94vw, 620px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
                        <Info className="h-8 w-8" />
                        <span className="text-xs">No image available</span>
                      </div>
                    )}
                  </div>
                  {selectedSeller?.idBackImage && (
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 to-transparent p-4 transition-transform duration-200 group-hover:translate-y-0 sm:flex-row sm:justify-end sm:translate-y-full">
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 sm:w-36"
                        onClick={() => downloadImage(selectedSeller.idBackImage, `${selectedSeller.id}-id-back.jpg`)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-slate-700 hover:bg-slate-600 sm:w-36"
                        onClick={() => copyImageUrl(selectedSeller.idBackImage, `back-${selectedSeller.id}`)}
                      >
                        {copiedImageId === `back-${selectedSeller.id}` ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Current Status</span>
                {selectedSeller && getStatusBadge(selectedSeller.status)}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 sm:w-40"
                  onClick={() => {
                    if (selectedSeller) {
                      setSellerToVerify(selectedSeller);
                    }
                  }}
                >
                  Verify Seller
                </Button>
                <Button
                  variant="destructive"
                  className="w-full sm:w-40"
                  onClick={() => {
                    if (selectedSeller) {
                      updateStatusMutation.mutate({ id: selectedSeller.id, status: 'REJECTED' });
                      setSelectedSeller(null);
                    }
                  }}
                >
                  Reject Seller
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sellerToVerify} onOpenChange={(open) => !open && setSellerToVerify(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-950">Confirm seller verification</DialogTitle>
            <DialogDescription className="text-slate-400">
              Verify {sellerToVerify?.shopName || 'this shop'} and mark it as verified in the seller dashboard?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
              onClick={() => setSellerToVerify(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!sellerToVerify) return;
                updateStatusMutation.mutate({ id: sellerToVerify.id, status: 'APPROVED' });
                setSellerToVerify(null);
                setSelectedSeller(null);
              }}
            >
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sellerToBan} onOpenChange={(open) => !open && setSellerToBan(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-950">Ban seller</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ban {sellerToBan?.shopName || 'this seller'} and prevent this seller from logging in?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
              onClick={() => setSellerToBan(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!sellerToBan || updateStatusMutation.isPending}
              onClick={() => {
                if (!sellerToBan) return;
                updateStatusMutation.mutate({ id: sellerToBan.id, status: 'SUSPENDED' });
              }}
            >
              Ban Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sellerToDelete} onOpenChange={(open) => !open && setSellerToDelete(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-950">Delete seller</DialogTitle>
            <DialogDescription className="text-slate-400">
              Delete {sellerToDelete?.shopName || 'this seller'} from the system? This removes the seller account and seller-owned records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
              onClick={() => setSellerToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!sellerToDelete || deleteSellerMutation.isPending}
              onClick={() => {
                if (!sellerToDelete) return;
                deleteSellerMutation.mutate(sellerToDelete.id);
              }}
            >
              Delete Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sellerToSettle} onOpenChange={(open) => !open && setSellerToSettle(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-950">Settle pending balance</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to clear the pending balance of <span className="font-bold text-slate-950">{formatMoney(sellerToSettle?.pendingBalance || 0)}</span> for {sellerToSettle?.shopName || 'this seller'}? This will set their pending balance to $0.00.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
              onClick={() => setSellerToSettle(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!sellerToSettle || settlePendingMutation.isPending}
              onClick={() => {
                if (!sellerToSettle) return;
                settlePendingMutation.mutate(sellerToSettle.id);
              }}
            >
              Confirm Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!sellerForBalance}
        onOpenChange={(open) => {
          if (!open) {
            setSellerForBalance(null);
            setBalanceType('wallet');
            setBalanceMode('add');
            setBalanceAmount('');
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-950">Update seller {balanceType === 'wallet' ? 'wallet' : 'guarantee'} balance</DialogTitle>
            <DialogDescription className="text-slate-400">
              Adjust the {balanceType === 'wallet' ? 'wallet' : 'guarantee'} balance for {sellerForBalance?.shopName || 'this seller'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-slate-500">Current {balanceType === 'wallet' ? 'wallet' : 'guarantee'} balance</div>
              <div className="mt-1 text-2xl font-black text-emerald-700">{formatMoney(currentTargetBalance)}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <Select value={balanceMode} onValueChange={(value) => setBalanceMode((value || 'add') as BalanceMode)}>
                <SelectTrigger className="w-full border-slate-300 bg-white text-slate-800">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-700">
                  <SelectItem value="add">Add balance</SelectItem>
                  <SelectItem value="deduct">Deduct balance</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={balanceAmount}
                onChange={(event) => setBalanceAmount(event.target.value)}
                placeholder="Amount"
                className="border-slate-300 bg-white text-slate-800"
              />
            </div>

            {balanceAmount && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">New {balanceType === 'wallet' ? 'wallet' : 'guarantee'} balance</span>
                  <span className={cn('font-bold', projectedTargetBalance < 0 ? 'text-red-600' : 'text-slate-950')}>
                    {formatMoney(projectedTargetBalance)}
                  </span>
                </div>
                {projectedTargetBalance < 0 && (
                  <p className="mt-2 text-xs font-medium text-red-400">
                    Deduction cannot be greater than the current balance.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
              onClick={() => {
                setSellerForBalance(null);
                setBalanceType('wallet');
                setBalanceMode('add');
                setBalanceAmount('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!canSubmitBalance || updateBalanceMutation.isPending}
              onClick={() => {
                if (!sellerForBalance || !canSubmitBalance) return;
                updateBalanceMutation.mutate({
                  id: sellerForBalance.id,
                  type: balanceType,
                  mode: balanceMode,
                  amount: parsedBalanceAmount,
                });
              }}
            >
              Update Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!sellerForPackage}
        onOpenChange={(open) => {
          if (!open) {
            setSellerForPackage(null);
            setSelectedPackageId('');
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-950">Change seller package</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose the package for {sellerForPackage?.shopName || 'this seller'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Select value={selectedPackageId} onValueChange={(value) => setSelectedPackageId(value || '')}>
              <SelectTrigger className="w-full border-slate-300 bg-white text-slate-800">
                <SelectValue placeholder="Select package">
                  {selectedPackageId ? sellerPackages.find(p => p.id === selectedPackageId)?.name : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white text-slate-700">
                {sellerPackages.map((sellerPackage) => (
                  <SelectItem key={sellerPackage.id} value={sellerPackage.id}>
                    {sellerPackage.name} - {Number(sellerPackage.productLimit || 0).toLocaleString()} products - {Number(sellerPackage.profitPercent || 0)}% profit
                  </SelectItem>

                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
              onClick={() => {
                setSellerForPackage(null);
                setSelectedPackageId('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!sellerForPackage || !selectedPackageId || updatePackageMutation.isPending}
              onClick={() => {
                if (!sellerForPackage || !selectedPackageId) return;
                updatePackageMutation.mutate({
                  id: sellerForPackage.id,
                  packageId: selectedPackageId,
                });
              }}
            >
              Update Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!sellerForPassword}
        onOpenChange={(open) => {
          if (!open) {
            setSellerForPassword(null);
            setNewPassword('');
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-950">Change seller password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a new password for {sellerForPassword?.shopName || 'this seller'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              type="password"
              placeholder="New password (min 6 characters)"
              className="border-slate-300 bg-white text-slate-800"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
              onClick={() => {
                setSellerForPassword(null);
                setNewPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!sellerForPassword || newPassword.length < 6 || changePasswordMutation.isPending}
              onClick={() => {
                if (!sellerForPassword) return;
                changePasswordMutation.mutate({
                  id: sellerForPassword.id,
                  password: newPassword,
                });
              }}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
