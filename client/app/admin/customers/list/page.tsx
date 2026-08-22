'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontal,
  Search,
  UserPlus,
  RefreshCcw,
  Ban,
  Trash2,
  LogIn,
  Wallet,
  Pencil,
} from 'lucide-react';
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
} from '../../../../components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { User } from '@aventuramall/shared';
import { AdminCustomer, EditCustomerDialog } from '@/components/admin/EditCustomerDialog';

interface ApiClientError extends Error {
  data?: {
    error?: string;
    message?: string;
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const apiError = error as ApiClientError;
    return apiError.data?.error || apiError.data?.message || error.message || fallback;
  }

  return fallback;
}

export default function CustomerListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [rechargeUser, setRechargeUser] = useState<AdminCustomer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<AdminCustomer | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [customerToToggleBan, setCustomerToToggleBan] = useState<AdminCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<AdminCustomer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [virtualQuantity, setVirtualQuantity] = useState('10');
  const [virtualInitialBalance, setVirtualInitialBalance] = useState('0');
  const [virtualDisableLogin, setVirtualDisableLogin] = useState(true);

  // Fetch Customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => apiClient.get<{ data: AdminCustomer[] }>('/api/admin/customers'),
  });

  const customers = customersData?.data || [];

  // Mutations
  const rechargeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiClient.patch(`/api/admin/customers/${id}/recharge`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      toast.success('Wallet recharged successfully');
      setRechargeUser(null);
      setRechargeAmount('');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to recharge wallet'));
    },
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/admin/customers/${id}/ban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      toast.success('User status updated');
      setCustomerToToggleBan(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update user status'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      toast.success('User deleted successfully');
      setCustomerToDelete(null);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete user'));
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{
        token: string;
        user: { id: string; email: string; name: string; role: string };
      }>(`/api/admin/customers/${id}/impersonate`, {}),
    onSuccess: ({ token, user }) => {
      const existingToken = localStorage.getItem('auth_token');
      if (existingToken && existingToken !== token) {
        localStorage.setItem('impersonation_previous_auth_token', existingToken);
      }

      localStorage.setItem('auth_token', token);
      toast.success(`Logged in as ${user.name}`);
      window.location.href = '/';
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to login as customer'));
    },
  });

  const createVirtualCustomersMutation = useMutation({
    mutationFn: ({
      quantity,
      initialBalance,
      disableLogin,
    }: {
      quantity: number;
      initialBalance: number;
      disableLogin: boolean;
    }) =>
      apiClient.post<{ created: number; data: User[] }>('/api/admin/customers/virtual', {
        quantity,
        initialBalance,
        disableLogin,
      }),
    onSuccess: ({ created }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      toast.success(`Created ${created} virtual customer${created === 1 ? '' : 's'}`);
      setIsCreateDialogOpen(false);
      setVirtualQuantity('10');
      setVirtualInitialBalance('0');
      setVirtualDisableLogin(true);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to create virtual customers'));
    },
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c as any).phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecharge = () => {
    if (!rechargeUser || !rechargeAmount) return;
    rechargeMutation.mutate({
      id: rechargeUser.id,
      amount: parseFloat(rechargeAmount),
    });
  };

  const handleCreateVirtualCustomers = () => {
    const quantity = Number(virtualQuantity);
    const initialBalance = Number(virtualInitialBalance);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      toast.error('Quantity must be a whole number between 1 and 100.');
      return;
    }

    if (!Number.isFinite(initialBalance) || initialBalance < 0) {
      toast.error('Initial balance must be zero or higher.');
      return;
    }

    createVirtualCustomersMutation.mutate({
      quantity,
      initialBalance,
      disableLogin: virtualDisableLogin,
    });
  };

  const handleConfirmToggleBan = () => {
    if (!customerToToggleBan) return;
    banMutation.mutate(customerToToggleBan.id);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    deleteMutation.mutate(customerToDelete.id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer List</h1>
          <p className="text-muted-foreground">
            Manage your store&apos;s customers and their account balances.
          </p>
        </div>
        <Button
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Create Virtual Customers
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-9 bg-white/5 border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#1a1c2e] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-slate-300">Name</TableHead>
              <TableHead className="text-slate-300">Email</TableHead>
              <TableHead className="text-slate-300">Phone</TableHead>
              <TableHead className="text-slate-300">Package</TableHead>
              <TableHead className="text-slate-300">Wallet Balance</TableHead>
              <TableHead className="text-slate-300 w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">{customer.email}</TableCell>
                  <TableCell className="text-slate-400">
                    {(customer as any).phone || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                    >
                      {(customer as any).package || 'Basic'}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                      <Wallet className="h-4 w-4" />$
                      {Number(customer.walletBalance).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'icon' }),
                          'text-slate-400 hover:text-white h-8 w-8 p-0'
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-[#1a1c2e] border-white/10 text-slate-300"
                      >
                        <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-white/5"
                          onClick={() => setCustomerToEdit(customer as AdminCustomer)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit Customer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-white/5"
                          onClick={() => setRechargeUser(customer)}
                        >
                          <Wallet className="mr-2 h-4 w-4" /> Recharge Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-white/5"
                          disabled={impersonateMutation.isPending || customer.isBanned}
                          onClick={() => impersonateMutation.mutate(customer.id)}
                        >
                          <LogIn className="mr-2 h-4 w-4" /> Login as Customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                          className={cn(
                            'cursor-pointer hover:bg-white/5',
                            customer.isBanned ? 'text-green-400' : 'text-amber-400'
                          )}
                          onClick={() => setCustomerToToggleBan(customer)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {customer.isBanned ? 'Unban Customer' : 'Ban Customer'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-300"
                          onClick={() => setCustomerToDelete(customer)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Customer
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

      <EditCustomerDialog
        key={customerToEdit?.id ?? 'none'}
        customer={customerToEdit}
        onClose={() => setCustomerToEdit(null)}
      />

      {/* Recharge Dialog */}
      <Dialog open={!!rechargeUser} onOpenChange={() => setRechargeUser(null)}>
        <DialogContent className="bg-[#1a1c2e] border-white/10 text-slate-300">
          <DialogHeader>
            <DialogTitle>Recharge Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Recharge amount for {rechargeUser?.name}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-7 bg-white/5 border-white/10"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRechargeUser(null)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleRecharge}
              disabled={rechargeMutation.isPending}
            >
              {rechargeMutation.isPending ? 'Processing...' : 'Recharge Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#1a1c2e] border-white/10 text-slate-300">
          <DialogHeader>
            <DialogTitle>Create Virtual Customers</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="virtual-quantity" className="text-slate-300">
                  Quantity
                </Label>
                <Input
                  id="virtual-quantity"
                  type="number"
                  min={1}
                  max={100}
                  value={virtualQuantity}
                  onChange={(event) => setVirtualQuantity(event.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="virtual-initial-balance" className="text-slate-300">
                  Initial balance
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="virtual-initial-balance"
                    type="number"
                    min={0}
                    step="0.01"
                    value={virtualInitialBalance}
                    onChange={(event) => setVirtualInitialBalance(event.target.value)}
                    className="pl-7 bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-1">
                <Label htmlFor="virtual-disable-login" className="text-slate-200">
                  Disable login
                </Label>
                <p className="text-xs text-slate-500">
                  Creates customers as disabled so they cannot use regular login or admin
                  impersonation.
                </p>
              </div>
              <Switch
                id="virtual-disable-login"
                checked={virtualDisableLogin}
                onCheckedChange={setVirtualDisableLogin}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateVirtualCustomers}
              disabled={createVirtualCustomersMutation.isPending}
            >
              {createVirtualCustomersMutation.isPending ? 'Creating...' : 'Create Customers'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!customerToToggleBan} onOpenChange={() => setCustomerToToggleBan(null)}>
        <DialogContent className="bg-[#1a1c2e] border-white/10 text-slate-300">
          <DialogHeader>
            <DialogTitle>
              {customerToToggleBan?.isBanned ? 'Unban Customer' : 'Ban Customer'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 text-sm text-slate-400">
            <p>
              {customerToToggleBan?.isBanned
                ? 'This customer will be allowed to log in and use their account again.'
                : 'This customer will be disabled and blocked from regular login.'}
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-slate-200">{customerToToggleBan?.name}</p>
              <p className="text-slate-500">{customerToToggleBan?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCustomerToToggleBan(null)}
              disabled={banMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className={
                customerToToggleBan?.isBanned
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }
              onClick={handleConfirmToggleBan}
              disabled={banMutation.isPending}
            >
              {banMutation.isPending
                ? 'Updating...'
                : customerToToggleBan?.isBanned
                  ? 'Unban Customer'
                  : 'Ban Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <DialogContent className="bg-[#1a1c2e] border-white/10 text-slate-300">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 text-sm text-slate-400">
            <p>
              This permanently deletes the customer account and related customer data. This action
              cannot be undone.
            </p>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="font-semibold text-slate-100">{customerToDelete?.name}</p>
              <p className="text-slate-400">{customerToDelete?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCustomerToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// force refresh
