'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type PaymentNetwork = 'TRC20' | 'ETH' | 'BTC' | 'BSC' | 'SOL';

interface PaymentMethod {
  id: string;
  network: PaymentNetwork;
  logo: string;
  address: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiClientError extends Error {
  data?: {
    error?: string;
    message?: string;
  };
}

const paymentNetworks: PaymentNetwork[] = ['TRC20', 'ETH', 'BTC', 'BSC', 'SOL'];

const emptyForm = {
  network: 'TRC20' as PaymentNetwork,
  address: '',
  isEnabled: true,
  logoFileName: '',
  logoPreview: '',
  logoBase64: '',
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const apiError = error as ApiClientError;
    return apiError.data?.error || apiError.data?.message || error.message || fallback;
  }
  return fallback;
}

function isValidAddressForNetwork(network: PaymentNetwork, address: string) {
  const trimmed = address.trim();
  switch (network) {
    case 'BTC':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
    case 'ETH':
    case 'BSC':
      return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
    case 'TRC20':
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed);
    case 'SOL':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    default:
      return false;
  }
}

export default function AdminPaymentPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState(emptyForm);

  const methodsQuery = useQuery({
    queryKey: ['admin', 'payment-methods'],
    queryFn: () => apiClient.get<{ data: PaymentMethod[] }>('/api/admin/payment-methods'),
  });

  const methods = methodsQuery.data?.data || [];

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = editing
        ? {
            network: form.network,
            address: form.address.trim(),
            isEnabled: form.isEnabled,
            logo: editing.logo,
            logoBase64: form.logoBase64 || undefined,
          }
        : {
            network: form.network,
            address: form.address.trim(),
            isEnabled: form.isEnabled,
            logoBase64: form.logoBase64,
          };

      if (editing) {
        return apiClient.put(`/api/admin/payment-methods/${editing.id}`, payload);
      }
      return apiClient.post('/api/admin/payment-methods', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-methods'] });
      toast.success(editing ? 'Payment method updated' : 'Payment method created');
      closeDialog();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to save payment method'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/payment-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-methods'] });
      toast.success('Payment method deleted');
      setDeleting(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete payment method'));
    },
  });

  const dialogTitle = useMemo(
    () => (editing ? 'Edit Payment Method' : 'Add Payment Method'),
    [editing]
  );

  const openCreateDialog = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditing(method);
    setForm({
      network: method.network,
      address: method.address,
      isEnabled: method.isEnabled,
      logoFileName: '',
      logoPreview: method.logo,
      logoBase64: '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const onLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo size must be 2MB or less');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((current) => ({
        ...current,
        logoBase64: String(reader.result || ''),
        logoPreview: String(reader.result || ''),
        logoFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const submitForm = () => {
    if (!form.address.trim()) {
      toast.error('Wallet address is required');
      return;
    }

    if (!isValidAddressForNetwork(form.network, form.address)) {
      toast.error(`Invalid wallet address for ${form.network}`);
      return;
    }

    if (!editing && !form.logoBase64) {
      toast.error('Logo is required');
      return;
    }

    upsertMutation.mutate();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment System</h1>
          <p className="text-muted-foreground">
            Manage crypto payment networks and wallet addresses shown to sellers.
          </p>
        </div>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 md:w-auto" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Payment Method
        </Button>
      </div>

      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'payment-methods'] })}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1c2e]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-slate-300">Network</TableHead>
              <TableHead className="text-slate-300">Logo</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Address</TableHead>
              <TableHead className="w-[100px] text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methodsQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                  Loading payment methods...
                </TableCell>
              </TableRow>
            ) : methods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                  No payment methods yet.
                </TableCell>
              </TableRow>
            ) : (
              methods.map((method) => (
                <TableRow key={method.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-semibold text-slate-200">{method.network}</TableCell>
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded-md border border-white/10 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={method.logo} alt={`${method.network} logo`} className="h-full w-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        method.isEnabled
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                      )}
                    >
                      {method.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[360px] truncate font-mono text-sm text-slate-300" title={method.address}>
                    {method.address}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'icon' }),
                          'h-8 w-8 p-0 text-slate-400 hover:text-white'
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 border-white/10 bg-[#1a1c2e] text-slate-300">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="cursor-pointer hover:bg-white/5" onClick={() => openEditDialog(method)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => setDeleting(method)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-white/10 bg-[#1a1c2e] text-slate-300">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payment-network" className="text-slate-200">Network</Label>
              <select
                id="payment-network"
                className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none"
                value={form.network}
                onChange={(event) => setForm((current) => ({ ...current, network: event.target.value as PaymentNetwork }))}
              >
                {paymentNetworks.map((network) => (
                  <option key={network} value={network} className="bg-slate-900">
                    {network}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Logo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLogoSelect}
              />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Browse
                </Button>
                <Input
                  readOnly
                  value={form.logoFileName || (editing ? 'Current logo selected' : '')}
                  placeholder="Choose logo image"
                  className="bg-white/5 border-white/10"
                />
              </div>
              {form.logoPreview ? (
                <div className="h-12 w-12 overflow-hidden rounded-md border border-white/10 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-address" className="text-slate-200">Address</Label>
              <Input
                id="wallet-address"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                placeholder={`Enter ${form.network} wallet address`}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
              <div>
                <div className="text-sm font-medium text-slate-200">Enabled</div>
                <div className="text-xs text-slate-500">Toggle availability for sellers</div>
              </div>
              <Switch
                checked={form.isEnabled}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, isEnabled: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={submitForm}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Add Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="border-white/10 bg-[#1a1c2e] text-slate-300">
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            This will permanently delete <span className="font-semibold text-slate-200">{deleting?.network}</span> payment method.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
