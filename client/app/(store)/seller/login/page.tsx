'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sellerSignIn, useSellerSession } from '@/lib/seller-auth-client';
import Link from 'next/link';
import { Eye, EyeOff, Store } from 'lucide-react';

export default function SellerLoginPage() {
  const router = useRouter();
  const { refresh } = useSellerSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await sellerSignIn({ email, password });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data) {
        await refresh();
        router.push('/seller/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none p-5">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Seller Login</CardTitle>
          <CardDescription>Enter your credentials to access your shop</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
              </div>
              <Input
                type="email"
                placeholder="seller@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="........"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="mt-2 w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-600">
            Don't have a seller account?{' '}
            <Link href="/seller/register" className="font-medium text-blue-600 hover:underline">
              Apply now
            </Link>
          </p>
          <p className="mt-4 text-xs text-slate-400">
            <Link href="/" className="hover:underline">
              Return to Customer Store
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
