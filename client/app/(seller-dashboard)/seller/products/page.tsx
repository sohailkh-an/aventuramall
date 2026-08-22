'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award,
  Boxes,
  ExternalLink,
  Frown,
  Loader2,
  PackageCheck,
  Search,
  Upload,
} from 'lucide-react';
import { useSellerSession, sellerAuthFetch } from '@/lib/seller-auth-client';
import { toast } from 'sonner';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SellerProductRow {
  id: string;
  sourceProductId: string;
  name: string;
  description: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  images: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  category?: {
    name: string;
  } | null;
  sourceProduct?: {
    soldBy: string | null;
    stock: number;
    isActive: boolean;
  } | null;
}

interface SellerProductsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  packageLimit: number;
}

export default function SellerProductsPage() {
  const { data: session } = useSellerSession();
  const sellerPackage = session?.seller?.sellerPackage;
  const packageLimit = sellerPackage?.productLimit || 300;
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [meta, setMeta] = useState<SellerProductsMeta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const usedSlots = meta?.total || 0;
  const remainingSlots = Math.max((meta?.packageLimit || packageLimit) - usedSlots, 0);
  const usagePercent = Math.min(
    Math.round((usedSlots / (meta?.packageLimit || packageLimit)) * 100),
    100
  );

  const totalInventoryValue = useMemo(
    () => products.reduce((total, product) => total + Number(product.price) * product.stock, 0),
    [products]
  );

  const fetchProducts = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
        });

        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        }

        const response = await sellerAuthFetch(
          `${API_BASE}/api/seller/products?${params.toString()}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load seller products');
        }

        setProducts(result.data || []);
        setMeta(result.meta);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load seller products');
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProducts(1);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProducts]);

  return (
    <div className="space-y-5 p-3 sm:p-4 md:space-y-6 md:p-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 shadow-sm sm:p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-blue-100/70" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-blue-600 sm:tracking-[0.25em]">
              Seller Inventory
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              My Products
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Products imported from the storehouse and attached to{' '}
              {session?.seller?.shopName || 'your shop'}.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
            <Link
              href="/seller/storehouse"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 sm:h-8 sm:px-2.5"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Storehouse
            </Link>
            <Link
              href="/seller/storehouse"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700 sm:h-8 sm:px-2.5"
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              Add More Products
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-none bg-blue-600 text-white shadow-sm">
          <CardContent className="p-6">
            <Upload className="mb-4 h-8 w-8 text-blue-100" />
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-blue-100">Remaining Uploads</p>
                <h2 className="mt-1 text-4xl font-black">{remainingSlots.toLocaleString()}</h2>
              </div>
              <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                {usedSlots.toLocaleString()} used
              </p>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${usagePercent}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="flex h-full items-center gap-4 p-6">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              <Award className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Current Package</p>
              <h3 className="text-xl font-black text-slate-900">
                {sellerPackage?.name || 'Silver'} Shop
              </h3>
              <p className="text-sm text-slate-500">
                {packageLimit.toLocaleString()} product limit
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="flex h-full items-center gap-4 p-6">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
              <Boxes className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Visible Inventory Value</p>
              <h3 className="text-xl font-black text-slate-900">
                ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h3>
              <p className="text-sm text-slate-500">Based on this page</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Product List</h2>
            <p className="text-sm text-slate-500">
              {(meta?.total || 0).toLocaleString()} products attached to your shop
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              type="search"
              placeholder="Search product"
              className="h-10 bg-slate-50 pl-9"
            />
          </div>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {isLoading ? (
            <div className="rounded-xl bg-slate-50 px-6 py-12 text-center text-slate-500">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
              Loading seller products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-6 py-12 text-center text-slate-500">
              <Frown className="mx-auto mb-4 h-12 w-12 text-slate-400" strokeWidth={1.5} />
              <p className="text-lg font-medium text-slate-600">Nothing found</p>
              <p className="mt-1 text-sm">
                Add products from the Product Storehouse to see them here.
              </p>
            </div>
          ) : (
            products.map((product) => <ProductMobileCard key={product.id} product={product} />)
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4 font-black">Product</th>
                <th className="px-5 py-4 font-black">Category</th>
                <th className="px-5 py-4 font-black">Stock</th>
                <th className="px-5 py-4 font-black">Price</th>
                {/* <th className="px-5 py-4 font-black">Source</th> */}
                <th className="px-5 py-4 font-black">Status</th>
                <th className="px-5 py-4 font-black">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
                    Loading seller products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Frown className="mb-4 h-12 w-12 text-slate-400" strokeWidth={1.5} />
                      <p className="text-lg font-medium text-slate-600">Nothing found</p>
                      <p className="mt-1 text-sm">
                        Add products from the Product Storehouse to see them here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="group bg-white transition hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="h-16 w-16 flex-shrink-0 rounded-2xl border border-slate-100 bg-slate-100 bg-cover bg-center shadow-sm"
                          style={{
                            backgroundImage: product.images[0]
                              ? `url(${product.images[0]})`
                              : undefined,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-black text-slate-900">{product.name}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {product.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900">
                        {product.stock.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">units</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900">
                        $
                        {Number(product.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      {product.compareAtPrice && (
                        <div className="text-xs text-slate-400 line-through">
                          $
                          {Number(product.compareAtPrice).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      )}
                    </td>
                    {/* <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-700">{product.sourceProduct?.soldBy || 'Storehouse'}</div>
                      <div className="text-xs text-slate-400">source catalog</div>
                    </td> */}
                    <td className="px-5 py-4">
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-xs font-black',
                          product.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500',
                        ].join(' ')}
                      >
                        {product.isActive ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(product.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={meta.page <= 1 || isLoading}
                onClick={() => fetchProducts(meta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={meta.page >= meta.totalPages || isLoading}
                onClick={() => fetchProducts(meta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProductMobileCard({ product }: { product: SellerProductRow }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div
          className="h-20 w-20 flex-shrink-0 rounded-xl border border-slate-100 bg-slate-100 bg-cover bg-center"
          style={{ backgroundImage: product.images[0] ? `url(${product.images[0]})` : undefined }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-900">
              {product.name}
            </h3>
            <span
              className={[
                'flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black',
                product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {product.isActive ? 'Published' : 'Hidden'}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {product.description || 'No description'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-400">Price</p>
              <p className="font-black text-slate-900">
                $
                {Number(product.price).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Stock</p>
              <p className="font-black text-slate-900">{product.stock.toLocaleString()} units</p>
            </div>
            <div>
              <p className="text-slate-400">Category</p>
              <p className="truncate font-semibold text-slate-700">
                {product.category?.name || 'Uncategorized'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Added</p>
              <p className="font-semibold text-slate-700">
                {new Date(product.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
