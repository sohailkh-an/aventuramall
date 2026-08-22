'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { sellerAuthFetch, useSellerSession } from '@/lib/seller-auth-client';
import { Check, FilterX, Loader2, PackageCheck, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ALL_FILTERS_VALUE = 'all';
const STOREHOUSE_BRANDS = [
  'ACER',
  'Adidas',
  'Apple',
  'ASUS',
  'OnePlus',
  'Samsung',
  'Sony',
  'Puma',
  'Reebok',
  'Rolex',
  'Toyota',
  'Volvo',
];

interface StorehouseCategory {
  id: string;
  name: string;
  slug: string;
}

interface StorehouseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  images: string[];
  stock: number;
  alreadyAdded: boolean;
  category?: {
    name: string;
  } | null;
}

interface StorehouseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sellerProductsCount: number;
  packageLimit: number;
}

export default function SellerStorehousePage() {
  const { data: session } = useSellerSession();
  const seller = session?.seller;
  const isVerified = seller?.status === 'APPROVED';
  const [products, setProducts] = useState<StorehouseProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<StorehouseProduct[]>([]);
  const [categories, setCategories] = useState<StorehouseCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTERS_VALUE);
  const [selectedBrand, setSelectedBrand] = useState(ALL_FILTERS_VALUE);
  const [meta, setMeta] = useState<StorehouseMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);

  const profitPercent = Number(session?.seller?.sellerPackage?.profitPercent || 15);
  const remainingSlots = Math.max((meta?.packageLimit || 300) - (meta?.sellerProductsCount || 0), 0);
  const hasMore = meta ? meta.page < meta.totalPages : false;
  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedCategory !== ALL_FILTERS_VALUE ||
    selectedBrand !== ALL_FILTERS_VALUE
  );
  const selectedCategoryLabel =
    selectedCategory === ALL_FILTERS_VALUE
      ? 'All categories'
      : categories.find((category) => category.slug === selectedCategory)?.name || 'All categories';
  const selectedBrandLabel = selectedBrand === ALL_FILTERS_VALUE ? 'All brands' : selectedBrand;

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((product) => product.id)),
    [selectedProducts]
  );

  const fetchProducts = useCallback(async (page = 1, reset = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
      });

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      if (selectedCategory !== ALL_FILTERS_VALUE) {
        params.set('category', selectedCategory);
      }

      if (selectedBrand !== ALL_FILTERS_VALUE) {
        params.set('brand', selectedBrand);
      }

      const response = await sellerAuthFetch(`${API_BASE}/api/seller/storehouse/products?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load storehouse products');
      }

      setProducts((current) => reset ? result.data : [...current, ...result.data]);
      setMeta(result.meta);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load storehouse products');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedBrand]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        const response = await sellerAuthFetch(`${API_BASE}/api/categories`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load categories');
        }

        if (isMounted) {
          setCategories(result.data || []);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load categories');
      }
    }

    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProducts(1, true);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProducts]);

  const toggleProduct = (product: StorehouseProduct) => {
    if (!isVerified) {
      toast.error('Your shop must be verified before you can add storehouse products.');
      return;
    }

    if (product.alreadyAdded) return;

    setSelectedProducts((current) => {
      if (current.some((item) => item.id === product.id)) {
        return current.filter((item) => item.id !== product.id);
      }

      if (current.length >= remainingSlots) {
        toast.error(`Your package only has ${remainingSlots} product slot${remainingSlots === 1 ? '' : 's'} left.`);
        return current;
      }

      return [...current, product];
    });
  };

  const removeSelectedProduct = (productId: string) => {
    setSelectedProducts((current) => current.filter((product) => product.id !== productId));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(ALL_FILTERS_VALUE);
    setSelectedBrand(ALL_FILTERS_VALUE);
  };

  const addSelectedProducts = async () => {
    if (!isVerified) {
      toast.error('Your shop must be verified before you can add storehouse products.');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Select at least one product first.');
      return;
    }

    setIsAdding(true);
    try {
      const response = await sellerAuthFetch(`${API_BASE}/api/seller/products/bulk-add`, {
        method: 'POST',
        body: JSON.stringify({ productIds: selectedProducts.map((product) => product.id) }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add products');
      }

      toast.success(`Added ${result.added} product${result.added === 1 ? '' : 's'} to your products.`);
      setSelectedProducts([]);
      await fetchProducts(1, true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add products');
    } finally {
      setIsAdding(false);
    }
  };

  const addAllProducts = async () => {
    if (!isVerified) {
      toast.error('Your shop must be verified before you can add storehouse products.');
      return;
    }

    if (remainingSlots === 0) {
      toast.error('Your package product limit is already full.');
      return;
    }

    setIsAddingAll(true);
    try {
      const response = await sellerAuthFetch(`${API_BASE}/api/seller/products/bulk-add`, {
        method: 'POST',
        body: JSON.stringify({ mode: 'all' }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add products');
      }

      toast.success(`Added ${result.added} product${result.added === 1 ? '' : 's'} to your products.`);
      setSelectedProducts([]);
      await fetchProducts(1, true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add products');
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Storehouse</h1>
          <p className="text-sm text-slate-500">
            Choose catalog products and add them to your shop. Remaining package slots: {remainingSlots.toLocaleString()}.
          </p>
        </div>
        <Button
          type="button"
          className="h-11 w-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
          disabled={!isVerified || remainingSlots === 0 || isAddingAll || isAdding}
          onClick={addAllProducts}
        >
          {isAddingAll ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="mr-2 h-4 w-4" />
          )}
          Add all to My Products
        </Button>
      </div>

      {seller && !isVerified && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center">
          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Seller verification required</p>
            <p className="text-sm text-amber-800">
              Your shop is currently {seller.status.toLowerCase()}. Storehouse product adding unlocks after admin verification.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(320px,1fr)_190px_190px_auto]">
            <div className="relative md:col-span-2 2xl:col-span-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by product name"
                className="h-11 rounded-lg border-slate-200 bg-white pl-12 text-sm shadow-sm"
              />
            </div>

            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value || ALL_FILTERS_VALUE)}>
              <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white px-3 text-sm shadow-sm">
                <span className="min-w-0 truncate text-left">{selectedCategoryLabel}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTERS_VALUE}>All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={(value) => setSelectedBrand(value || ALL_FILTERS_VALUE)}>
              <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white px-3 text-sm shadow-sm">
                <span className="min-w-0 truncate text-left">{selectedBrandLabel}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTERS_VALUE}>All brands</SelectItem>
                {STOREHOUSE_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg bg-white px-4 text-sm shadow-sm md:col-span-2 2xl:col-span-1"
                onClick={clearFilters}
              >
                <FilterX className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
            {products.map((product) => {
              const isSelected = selectedIds.has(product.id);
              const price = Number(product.price);
              const profit = price * (profitPercent / 100);

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={!isVerified || product.alreadyAdded}
                  onClick={() => toggleProduct(product)}
                  className={[
                    'group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200',
                    !isVerified || product.alreadyAdded ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <div className="relative aspect-square bg-slate-100">
                    {product.images[0] ? (
                      <div
                        className="h-full w-full bg-cover bg-center transition group-hover:scale-[1.03]"
                        style={{ backgroundImage: `url(${product.images[0]})` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <PackageCheck className="h-10 w-10" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-md bg-green-700 px-2.5 py-1 text-xs font-bold text-white">
                      In stock: {product.stock}
                    </span>
                    {(isSelected || product.alreadyAdded) && (
                      <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 p-5">
                    <p className="line-clamp-2 min-h-12 text-lg font-bold text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.category?.name || 'Uncategorized'}</p>
                    <div className="text-slate-800">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-sm text-slate-600">Profit: ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    {product.alreadyAdded && <p className="text-xs font-semibold text-blue-600">Already in your products</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {products.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No products found in the storehouse.
            </div>
          )}

          <div className="flex justify-center">
            {hasMore && (
              <Button
                variant="outline"
                className="min-w-44"
                disabled={isLoading}
                onClick={() => fetchProducts((meta?.page || 1) + 1)}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Load More
              </Button>
            )}
          </div>
        </section>

        <aside className="xl:sticky xl:top-6 h-fit rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-900">Selected Products</h2>
            <p className="text-sm text-slate-500">{selectedProducts.length} selected</p>
          </div>

          <div className="max-h-[520px] min-h-[260px] overflow-y-auto p-5">
            {selectedProducts.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                {isVerified ? (
                  <>
                    <PackageCheck className="mb-3 h-10 w-10" />
                    Select products from the storehouse.
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mb-3 h-10 w-10" />
                    Verification required before adding products.
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                    <div
                      className="h-16 w-16 flex-shrink-0 rounded-lg bg-slate-100 bg-cover bg-center"
                      style={{ backgroundImage: product.images[0] ? `url(${product.images[0]})` : undefined }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm font-bold text-slate-900">${Number(product.price).toLocaleString()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
                      onClick={() => removeSelectedProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-5">
            <Button
              className="h-12 w-full bg-blue-600 text-base font-semibold hover:bg-blue-700"
              disabled={!isVerified || selectedProducts.length === 0 || isAdding || isAddingAll}
              onClick={addSelectedProducts}
            >
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to my products
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
