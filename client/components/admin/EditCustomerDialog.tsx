'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export type AdminCustomer = {
  id: string; email: string; name: string; image?: string | null; phone?: string | null; package?: string | null;
  walletBalance?: string | number | null;
  emailVerified: boolean; isBanned: boolean; cashPayment?: boolean; bankPayment?: boolean;
  bankName?: string | null; bankAccountName?: string | null; bankAccountNumber?: string | null;
  bankRoutingNumber?: string | null; usdtPayment?: boolean; usdtLink?: string | null; usdtAddress?: string | null;
  addresses?: Array<{ id: string; label: string; street: string; city: string; state: string; zip: string; country: string; phone?: string | null; isDefault: boolean }>;
};


type Props = { customer: AdminCustomer | null; onClose: () => void };
type FormState = Omit<AdminCustomer, 'id' | 'addresses'> & { addresses: NonNullable<AdminCustomer['addresses']> };

const stringFields = [
  ['name', 'Name'], ['email', 'Email'], ['image', 'Image URL'], ['phone', 'Phone'], ['package', 'Package'],
  ['bankName', 'Bank name'], ['bankAccountName', 'Bank account name'], ['bankAccountNumber', 'Bank account number'],
  ['bankRoutingNumber', 'Bank routing number'], ['usdtLink', 'USDT link'], ['usdtAddress', 'USDT address'],
] as const;

function toForm(customer: AdminCustomer): FormState {
  const { id: _id, addresses = [], ...fields } = customer; void _id;
  return { ...fields, addresses };
}

export function EditCustomerDialog({ customer, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(() => customer ? toForm(customer) : null);

  const saveMutation = useMutation({
    mutationFn: (payload: FormState) => apiClient.patch(`/api/admin/customers/${customer?.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      toast.success('Customer updated successfully');
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update customer'),
  });

  const setValue = (field: keyof FormState, value: string | boolean) =>
    setForm((current) => current ? { ...current, [field]: value } : current);

  return (
    <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#1a1c2e] border-white/10 text-slate-300 sm:max-w-3xl">
        <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
        {form && <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stringFields.map(([field, label]) => <div key={field} className="space-y-2">
              <Label htmlFor={`customer-${field}`}>{label}</Label>
              <Input id={`customer-${field}`} value={String(form[field] ?? '')} onChange={(e) => setValue(field, e.target.value)} className="bg-white/5 border-white/10" />
            </div>)}
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-5">
            {([
              ['emailVerified', 'Email verified'], ['isBanned', 'Banned'], ['cashPayment', 'Cash payment'],
              ['bankPayment', 'Bank payment'], ['usdtPayment', 'USDT payment'],
            ] as const).map(([field, label]) => <div key={field} className="space-y-2">
              <Label htmlFor={`customer-${field}`} className="text-xs">{label}</Label>
              <Switch id={`customer-${field}`} checked={Boolean(form[field])} onCheckedChange={(value) => setValue(field, value)} />
            </div>)}
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-100">Addresses</h3>
            {form.addresses.length === 0 ? <p className="text-sm text-slate-500">No saved addresses.</p> : form.addresses.map((address, index) => <div key={address.id} className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
              {(['label', 'street', 'city', 'state', 'zip', 'country', 'phone'] as const).map((field) => <div key={field} className="space-y-1">
                <Label htmlFor={`address-${address.id}-${field}`} className="capitalize">{field}</Label>
                <Input id={`address-${address.id}-${field}`} value={address[field] ?? ''} onChange={(e) => setForm((current) => current ? { ...current, addresses: current.addresses.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: e.target.value } : item) } : current)} className="bg-white/5 border-white/10" />
              </div>)}
              <div className="flex items-center gap-3"><Switch checked={address.isDefault} onCheckedChange={(value) => setForm((current) => current ? { ...current, addresses: current.addresses.map((item, itemIndex) => itemIndex === index ? { ...item, isDefault: value } : item) } : current)} /><Label>Default address</Label></div>
            </div>)}
          </div>
        </div>}
        <DialogFooter><Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={() => form && saveMutation.mutate(form)} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save changes'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
