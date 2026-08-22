'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ResetTransactionPasswordDialog } from '@/components/seller/ResetTransactionPasswordDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sellerAuthFetch } from '@/lib/seller-auth-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const transactionPasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, 'Current transaction password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New transaction password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm transaction password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New transaction passwords do not match',
    path: ['confirmPassword'],
  });

type TransactionPasswordFormValues = z.infer<typeof transactionPasswordSchema>;

export default function SellerTransactionPasswordPage() {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const form = useForm<TransactionPasswordFormValues>({
    resolver: zodResolver(transactionPasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: TransactionPasswordFormValues) => {
    try {
      const response = await sellerAuthFetch(`${API_BASE}/api/seller/transaction-password`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transaction password');
      }

      toast.success(result.message || 'Transaction password updated successfully.');
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update transaction password');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update the secure password used for seller wallet and transaction actions.
          </p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Change transaction password</CardTitle>
                <CardDescription>
                  Enter your current password, then confirm the new one.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current transaction password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  {...form.register('currentPassword')}
                />
                {form.formState.errors.currentPassword && (
                  <p className="text-sm font-medium text-red-500">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New transaction password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  {...form.register('newPassword')}
                />
                {form.formState.errors.newPassword && (
                  <p className="text-sm font-medium text-red-500">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm transaction password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm font-medium text-red-500">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700 sm:w-auto"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save transaction password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <RefreshCcw className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Reset transaction password</CardTitle>
                <CardDescription>
                  Replace the password from your signed-in seller session.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-4 p-4 sm:p-6">
            <div className="space-y-3">
              <p className="text-sm leading-6 text-slate-600"></p>

              <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      Use reset if you do not remember the current password
                    </p>
                    <p className="text-sm text-slate-600">
                      The reset dialog only asks for a new password and confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setResetDialogOpen(true)}
              className="h-11 w-full bg-rose-600 font-semibold text-white hover:bg-rose-700"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Open reset dialog
            </Button>
          </CardContent>
        </Card>
      </div>

      <ResetTransactionPasswordDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} />
    </div>
  );
}
