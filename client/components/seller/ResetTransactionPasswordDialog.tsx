'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sellerAuthFetch } from '@/lib/seller-auth-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const resetTransactionPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'New transaction password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm transaction password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New transaction passwords do not match',
    path: ['confirmPassword'],
  });

type ResetTransactionPasswordFormValues = z.infer<typeof resetTransactionPasswordSchema>;

interface ResetTransactionPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetTransactionPasswordDialog({
  open,
  onOpenChange,
}: ResetTransactionPasswordDialogProps) {
  const form = useForm<ResetTransactionPasswordFormValues>({
    resolver: zodResolver(resetTransactionPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form, open]);

  const handleSubmit = async (values: ResetTransactionPasswordFormValues) => {
    try {
      const response = await sellerAuthFetch(`${API_BASE}/api/seller/transaction-password/reset`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset transaction password');
      }

      toast.success(result.message || 'Transaction password reset successfully.');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset transaction password');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-xl rounded-2xl border-slate-200 bg-white p-0 shadow-xl sm:w-full">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-black text-slate-950 sm:text-xl">
                  Reset transaction password
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Set a new password from your signed-in seller session.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-4 py-4 sm:px-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p>
                Use this only if you are already signed in to the seller account. The reset will immediately
                replace the current transaction password.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-new-password" className="text-sm font-bold text-slate-700">
              New transaction password
            </Label>
            <Input
              id="reset-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              {...form.register('newPassword')}
              className="h-11 rounded-lg"
            />
            {form.formState.errors.newPassword && (
              <p className="text-sm font-medium text-rose-600">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password" className="text-sm font-bold text-slate-700">
              Confirm new password
            </Label>
            <Input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              {...form.register('confirmPassword')}
              className="h-11 rounded-lg"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm font-medium text-rose-600">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 bg-slate-50/60 px-0 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
              className="h-11 flex-1 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 flex-1 rounded-lg bg-rose-600 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
