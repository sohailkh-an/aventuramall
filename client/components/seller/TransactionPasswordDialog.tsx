'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TransactionPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionPasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: TransactionPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter your transaction password');
      return;
    }

    try {
      await onSubmit(password);
      setPassword('');
      setShowPassword(false);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setShowPassword(false);
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-lg border-slate-200 bg-white shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700">
              <Lock className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-950">
              Verify Transaction Password
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-password" className="text-sm font-bold text-slate-700">
              Transaction Password
            </Label>
            <div className="relative">
              <Input
                id="transaction-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your transaction password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                className="h-11 pr-12"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              This is the password you set for transaction verification.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Verify & Pay'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
