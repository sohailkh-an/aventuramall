'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  ChevronDown,
  Minus,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getNextPosProductsPageParam } from './productsPagination';

interface ApiClientError extends Error {
  data?: {
    error?: string;
    message?: string;
  };
}

interface PosSeller {
  id: string;
  email: string;
  shopName: string;
  name: string;
  status: string;
  shopLogo: string | null;
}

interface PosCategory {
  id: string;
  name: string;
  slug: string;
}

interface PosProduct {
  id: string;
  sellerId: string;
  sourceProductId: string;
  name: string;
  price: number | string;
  compareAtPrice: number | string | null;
  images: string[];
  stock: number;
  category: PosCategory;
}

interface PosCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  walletBalance: number | string;
  package: string | null;
}

interface PosAddress {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

interface CartLine {
  product: PosProduct;
  quantity: number;
}

const emptyAddressForm = {
  label: 'Home',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
  phone: '',
  isDefault: false,
};

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function formatMoney(value: number | string | null | undefined) {
  return money.format(toNumber(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const apiError = error as ApiClientError;
    return apiError.data?.error || apiError.data?.message || error.message || fallback;
  }

  return fallback;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim()) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function productImage(product: PosProduct) {
  return product.images[0] || '';
}

export default function AdminPosPage() {
  const queryClient = useQueryClient();
  const selectedCustomerIdRef = useRef<string | null>(null);
  const [sellerSearch, setSellerSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<PosSeller | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [isSellerOpen, setIsSellerOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);

  const sellersQuery = useQuery({
    queryKey: ['admin', 'pos', 'sellers', sellerSearch],
    queryFn: () =>
      apiClient.get<{ data: PosSeller[] }>(
        `/api/admin/pos/sellers${buildQuery({ search: sellerSearch, limit: 20 })}`
      ),
  });

  const customersQuery = useQuery({
    queryKey: ['admin', 'pos', 'customers', customerSearch],
    queryFn: () =>
      apiClient.get<{ data: PosCustomer[] }>(
        `/api/admin/pos/customers${buildQuery({ search: customerSearch, limit: 30 })}`
      ),
  });

  const productsQuery = useInfiniteQuery({
    queryKey: ['admin', 'pos', 'products', selectedSeller?.id, productSearch, categoryFilter, brandFilter],
    enabled: Boolean(selectedSeller),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiClient.get<{ data: PosProduct[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/pos/sellers/${selectedSeller?.id}/products${buildQuery({
          search: productSearch,
          category: categoryFilter,
          brand: brandFilter,
          page: pageParam,
          limit: 24,
        })}`
      ),
    getNextPageParam: (lastPage) => getNextPosProductsPageParam(lastPage.meta),
  });

  const filtersQuery = useQuery({
    queryKey: ['admin', 'pos', 'filters', selectedSeller?.id],
    enabled: Boolean(selectedSeller),
    queryFn: () =>
      apiClient.get<{ data: { categories: PosCategory[]; brands: string[] } }>(
        `/api/admin/pos/sellers/${selectedSeller?.id}/filters`
      ),
  });

  const addressesQuery = useQuery({
    queryKey: ['admin', 'pos', 'addresses', selectedCustomer?.id],
    enabled: Boolean(selectedCustomer),
    queryFn: () =>
      apiClient.get<{ data: PosAddress[] }>(
        `/api/admin/pos/customers/${selectedCustomer?.id}/addresses`
      ),
  });

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const subtotal = useMemo(
    () =>
      cartLines.reduce((total, line) => total + toNumber(line.product.price) * line.quantity, 0),
    [cartLines]
  );
  const totalItems = useMemo(
    () => cartLines.reduce((total, line) => total + line.quantity, 0),
    [cartLines]
  );
  const selectedAddress = addressesQuery.data?.data.find((address) => address.id === selectedAddressId);

  const createAddressMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ data: PosAddress }>(
        `/api/admin/pos/customers/${selectedCustomer?.id}/addresses`,
        {
          ...addressForm,
          phone: addressForm.phone || undefined,
        }
      ),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'addresses', selectedCustomer?.id] });
      setSelectedAddressId(data.id);
      setIsAddingAddress(false);
      setAddressForm(emptyAddressForm);
      toast.success('Address added');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to add address'));
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/admin/pos/orders', {
        sellerId: selectedSeller?.id,
        customerId: selectedCustomer?.id,
        shippingAddressId: selectedAddressId,
        items: cartLines.map((line) => ({
          sellerProductId: line.product.id,
          quantity: line.quantity,
        })),
      }),
    onSuccess: () => {
      toast.success('POS order placed');
      setCart({});
      setSelectedAddressId('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'customers'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to place order'));
    },
  });

  const selectSeller = (seller: PosSeller) => {
    setSelectedSeller(seller);
    setSellerSearch(seller.shopName);
    setIsSellerOpen(false);
    setProductSearch('');
    setCategoryFilter('');
    setBrandFilter('');
    setCart({});
  };

  const selectCustomer = (customer: PosCustomer) => {
    selectedCustomerIdRef.current = customer.id;
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setSelectedAddressId('');
    setIsCustomerOpen(false);

    void queryClient
      .fetchQuery({
        queryKey: ['admin', 'pos', 'addresses', customer.id],
        queryFn: () =>
          apiClient.get<{ data: PosAddress[] }>(
            `/api/admin/pos/customers/${customer.id}/addresses`
          ),
      })
      .then(({ data }) => {
        if (selectedCustomerIdRef.current !== customer.id) return;

        const defaultAddress = data.find((address) => address.isDefault) || data[0];
        if (defaultAddress) {
          setSelectedAddressId((current) => current || defaultAddress.id);
        }
      })
      .catch(() => {
        if (selectedCustomerIdRef.current === customer.id) {
          toast.error('Failed to load customer addresses');
        }
      });
  };

  const addToCart = (product: PosProduct) => {
    setCart((current) => {
      const existing = current[product.id];
      const currentQuantity = existing?.quantity || 0;
      if (currentQuantity >= product.stock) return current;

      return {
        ...current,
        [product.id]: {
          product,
          quantity: currentQuantity + 1,
        },
      };
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((current) => {
      const line = current[productId];
      if (!line) return current;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return {
        ...current,
        [productId]: {
          ...line,
          quantity: Math.min(quantity, line.product.stock),
        },
      };
    });
  };

  const openAddressDialog = () => {
    if (!selectedCustomer) {
      toast.error('Select a customer first');
      return;
    }
    setAddressDialogOpen(true);
  };

  const confirmAddress = () => {
    if (!selectedAddressId) {
      toast.error('Select an address for this order');
      return;
    }
    setAddressDialogOpen(false);
  };

  const submitAddress = () => {
    if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zip || !addressForm.country) {
      toast.error('Complete the address fields');
      return;
    }

    createAddressMutation.mutate();
  };

  const placeOrder = () => {
    if (!selectedSeller) return toast.error('Select a seller');
    if (!selectedCustomer) return toast.error('Select a customer');
    if (!selectedAddressId) return toast.error('Select a shipping address');
    if (!cartLines.length) return toast.error('Add products to the cart');
    // if (toNumber(selectedCustomer.walletBalance) < subtotal) {
    //   return toast.error('Customer wallet balance is not enough');
    // }

    placeOrderMutation.mutate();
  };

  const categories = filtersQuery.data?.data.categories || [];
  const brands = filtersQuery.data?.data.brands || [];
  const products = productsQuery.data?.pages.flatMap((page) => page.data) || [];
  const hasMoreProducts = Boolean(productsQuery.hasNextPage);

  return (
    <div className="min-h-full text-slate-900">
      <div className="mx-auto grid max-w-[1800px] gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 min-[1700px]:grid-cols-[minmax(240px,1.1fr)_minmax(220px,0.9fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)]">
            <SearchBox
              icon={<Search className="size-5" />}
              value={productSearch}
              onChange={setProductSearch}
              placeholder="Search seller products"
              disabled={!selectedSeller}
            />

            <SearchablePicker
              icon={<Store className="size-5" />}
              value={sellerSearch}
              placeholder="Search seller by shop or email"
              isOpen={isSellerOpen}
              onFocus={() => {
                setIsSellerOpen(true);
                setIsCustomerOpen(false);
              }}
              onChange={(value) => {
                setSellerSearch(value);
                setIsSellerOpen(true);
                setIsCustomerOpen(false);
              }}
              onClose={() => setIsSellerOpen(false)}
            >
              <PickerList
                isLoading={sellersQuery.isLoading}
                emptyText="No sellers found"
                items={sellersQuery.data?.data || []}
                renderItem={(seller) => (
                  <button
                    key={seller.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-100"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSeller(seller)}
                  >
                    <div className="grid size-9 place-items-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                      {seller.shopName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{seller.shopName}</div>
                      <div className="truncate text-xs text-slate-500">{seller.email}</div>
                    </div>
                  </button>
                )}
              />
            </SearchablePicker>

            <select
              className="h-14 w-full rounded-md border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none disabled:opacity-60"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              disabled={!selectedSeller}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              className="h-14 w-full rounded-md border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none disabled:opacity-60"
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
              disabled={!selectedSeller}
            >
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div className="min-h-[640px] rounded-md border border-slate-200 bg-white/50 p-3 shadow-sm">
            {!selectedSeller ? (
              <EmptyState
                icon={<Store className="size-10" />}
                title="Select a seller"
                message="Search by shop name or email to load that seller's displayed products."
              />
            ) : productsQuery.isLoading ? (
              <EmptyState
                icon={<RefreshCcw className="size-10 animate-spin" />}
                title="Loading products"
                message="Fetching the selected seller's active product list."
              />
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Boxes className="size-10" />}
                title="No listed products"
                message="This seller has no products matching the current filters."
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => {
                    const line = cart[product.id];
                    const remaining = product.stock - (line?.quantity || 0);

                    return (
                      <article
                        key={product.id}
                        className="group flex min-h-[330px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <button
                          type="button"
                          className="relative h-44 w-full bg-white"
                          onClick={() => addToCart(product)}
                        >
                          <Badge className="absolute left-2 top-2 z-10 border-emerald-500/20 bg-emerald-500 text-white">
                            In stock: {product.stock}
                          </Badge>
                          {productImage(product) ? (
                            <div
                              className="h-full w-full bg-contain bg-center bg-no-repeat"
                              style={{ backgroundImage: `url("${productImage(product)}")` }}
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-slate-300">
                              <Boxes className="size-12" />
                            </div>
                          )}
                        </button>
                        <div className="flex flex-1 flex-col gap-3 p-3">
                          <div className="min-h-[48px] text-sm font-bold leading-6 text-slate-900 line-clamp-2">
                            {product.name}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {product.compareAtPrice ? (
                              <span className="text-slate-400 line-through">
                                {formatMoney(product.compareAtPrice)}
                              </span>
                            ) : null}
                            <span className="font-semibold">{formatMoney(product.price)}</span>
                          </div>
                          <Button
                            className="mt-auto h-10 bg-orange-500 text-white hover:bg-orange-600"
                            disabled={remaining <= 0}
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="mr-2 size-4" />
                            {remaining <= 0 ? 'Added max' : 'Add'}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {hasMoreProducts ? (
                  <div className="flex justify-center pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-40 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      disabled={productsQuery.isFetchingNextPage}
                      onClick={() => void productsQuery.fetchNextPage()}
                    >
                      {productsQuery.isFetchingNextPage ? 'Loading more...' : 'Load more'}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">POS Checkout</h1>
                <p className="text-sm text-slate-500">
                  {selectedSeller ? selectedSeller.shopName : 'Select a seller to start'}
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                {totalItems} item{totalItems === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <SearchablePicker
                icon={<UserRound className="size-5" />}
                value={customerSearch}
                placeholder="Walk In Customer"
                isOpen={isCustomerOpen}
                onFocus={() => {
                  setIsCustomerOpen(true);
                  setIsSellerOpen(false);
                }}
                onChange={(value) => {
                  setCustomerSearch(value);
                  setIsCustomerOpen(true);
                  setIsSellerOpen(false);
                }}
                onClose={() => setIsCustomerOpen(false)}
              >
                <PickerList
                  isLoading={customersQuery.isLoading}
                  emptyText="No customers found"
                  items={customersQuery.data?.data || []}
                  renderItem={(customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-100"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{customer.name}</div>
                        <div className="truncate text-xs text-slate-500">{customer.email}</div>
                      </div>
                      <div className="text-xs font-semibold text-emerald-600">
                        {formatMoney(customer.walletBalance)}
                      </div>
                    </button>
                  )}
                />
              </SearchablePicker>
              <Button
                type="button"
                variant="outline"
                className="h-14 w-14 shrink-0"
                disabled={!selectedCustomer}
                onClick={openAddressDialog}
                title="Select shipping address"
              >
                <Truck className="size-5" />
              </Button>
            </div>

            {selectedCustomer ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-3 text-sm">
                <Wallet className="size-4 text-emerald-600" />
                <span className="font-semibold">{selectedCustomer.name}</span>
                <span className="text-slate-500">wallet</span>
                <span className="font-bold text-emerald-600">
                  {formatMoney(selectedCustomer.walletBalance)}
                </span>
              </div>
            ) : null}

            {selectedAddress ? (
              <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-950">
                <div className="font-semibold">Ship to {selectedAddress.label}</div>
                <div className="mt-1 text-orange-900/80">
                  {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state}
                </div>
              </div>
            ) : null}

            <div className="my-4 h-px bg-slate-200" />

            <div className="min-h-[300px] space-y-3">
              {cartLines.length === 0 ? (
                <EmptyState
                  compact
                  icon={<ShoppingCart className="size-9" />}
                  title="No Product Added"
                  message="Tap products from the left grid to build this order."
                />
              ) : (
                cartLines.map((line) => (
                  <div key={line.product.id} className="flex gap-3 rounded-md border border-slate-200 p-2">
                    <div
                      className="size-16 shrink-0 rounded-md bg-slate-100 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: productImage(line.product) ? `url("${productImage(line.product)}")` : undefined }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{line.product.name}</div>
                      <div className="text-sm text-slate-500">{formatMoney(line.product.price)}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <IconButton onClick={() => updateCartQuantity(line.product.id, line.quantity - 1)}>
                          <Minus className="size-4" />
                        </IconButton>
                        <span className="grid h-8 min-w-10 place-items-center rounded-md border text-sm font-semibold">
                          {line.quantity}
                        </span>
                        <IconButton onClick={() => updateCartQuantity(line.product.id, line.quantity + 1)}>
                          <Plus className="size-4" />
                        </IconButton>
                        <IconButton
                          className="ml-auto text-red-500 hover:bg-red-50"
                          onClick={() => updateCartQuantity(line.product.id, 0)}
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm">
              <TotalRow label="Sub Total" value={subtotal} />
              <TotalRow label="Tax" value={0} />
              <TotalRow label="Shipping" value={0} />
              <TotalRow label="Discount" value={0} />
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xl font-bold">
                <span>Total</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr] xl:grid-cols-1">
            {/*
            <Button variant="outline" className="h-12 justify-between">
              Shipping <ChevronDown className="size-4" />
            </Button>
            <Button variant="outline" className="h-12 justify-between">
              Discount <ChevronDown className="size-4" />
            </Button>
            */}
            <Button
              className="h-12 bg-orange-500 text-white hover:bg-orange-600"
              disabled={placeOrderMutation.isPending}
              onClick={placeOrder}
            >
              Place Order
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden bg-white p-0 text-slate-900 sm:max-w-2xl">
          <DialogHeader className="flex-shrink-0 border-b border-slate-200 p-6">
            <DialogTitle className="text-2xl font-bold">Shipping address</DialogTitle>
          </DialogHeader>

          <div className="address-dialog-scrollbar min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-6">
            {addressesQuery.isLoading ? (
              <div className="rounded-md border border-slate-200 p-6 text-center text-slate-500">
                Loading addresses...
              </div>
            ) : null}

            {(addressesQuery.data?.data || []).map((address) => (
              <button
                key={address.id}
                type="button"
                className={cn(
                  'flex w-full min-w-0 gap-4 rounded-md border p-4 text-left transition',
                  selectedAddressId === address.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
                onClick={() => setSelectedAddressId(address.id)}
              >
                <span
                  className={cn(
                    'mt-1 size-5 flex-shrink-0 rounded-full border',
                    selectedAddressId === address.id ? 'border-orange-500 bg-orange-500 shadow-[inset_0_0_0_4px_white]' : 'border-slate-300'
                  )}
                />
                <span className="grid min-w-0 gap-1 text-base">
                  <span>
                    <strong>Address:</strong> {address.street}
                  </span>
                  <span>
                    <strong>Postal code:</strong> {address.zip}
                  </span>
                  <span>
                    <strong>City:</strong> {address.city}
                  </span>
                  <span>
                    <strong>State:</strong> {address.state}
                  </span>
                  <span>
                    <strong>Country:</strong> {address.country}
                  </span>
                  <span>
                    <strong>Phone:</strong> {address.phone || selectedCustomer?.phone || 'N/A'}
                  </span>
                </span>
              </button>
            ))}

            {isAddingAddress ? (
              <div className="grid gap-3 rounded-md border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AddressField label="Label" value={addressForm.label} onChange={(value) => setAddressForm((form) => ({ ...form, label: value }))} />
                  <AddressField label="Phone" value={addressForm.phone} onChange={(value) => setAddressForm((form) => ({ ...form, phone: value }))} />
                </div>
                <AddressField label="Street" value={addressForm.street} onChange={(value) => setAddressForm((form) => ({ ...form, street: value }))} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <AddressField label="City" value={addressForm.city} onChange={(value) => setAddressForm((form) => ({ ...form, city: value }))} />
                  <AddressField label="State" value={addressForm.state} onChange={(value) => setAddressForm((form) => ({ ...form, state: value }))} />
                  <AddressField label="Postal code" value={addressForm.zip} onChange={(value) => setAddressForm((form) => ({ ...form, zip: value }))} />
                  <AddressField label="Country" value={addressForm.country} onChange={(value) => setAddressForm((form) => ({ ...form, country: value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingAddress(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    disabled={createAddressMutation.isPending}
                    onClick={submitAddress}
                  >
                    Save Address
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="h-16 w-full text-base"
                onClick={() => setIsAddingAddress(true)}
              >
                Add New Address
              </Button>
            )}
          </div>

          <DialogFooter className="m-0 flex-shrink-0 rounded-none bg-white p-6">
            <Button variant="ghost" onClick={() => setAddressDialogOpen(false)}>
              Close
            </Button>
            <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={confirmAddress}>
              Confirm
            </Button>
          </DialogFooter>
          <style jsx global>{`
            .address-dialog-scrollbar {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            .address-dialog-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SearchBox({
  icon,
  value,
  onChange,
  placeholder,
  disabled,
  onFocus,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        className="h-14 rounded-md border-slate-200 bg-white pl-12 text-base shadow-sm"
      />
    </div>
  );
}

function SearchablePicker({
  icon,
  value,
  placeholder,
  isOpen,
  onFocus,
  onChange,
  onClose,
  children,
}: {
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  isOpen: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose]);

  return (
    <div ref={pickerRef} className="relative min-w-0 flex-1">
      <SearchBox icon={icon} value={value} onChange={onChange} onFocus={onFocus} placeholder={placeholder} />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        onClick={onFocus}
      >
        <ChevronDown className="size-4" />
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function PickerList<T>({
  items,
  isLoading,
  emptyText,
  renderItem,
}: {
  items: T[];
  isLoading: boolean;
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (isLoading) {
    return <div className="px-3 py-4 text-center text-sm text-slate-500">Loading...</div>;
  }

  if (!items.length) {
    return <div className="px-3 py-4 text-center text-sm text-slate-500">{emptyText}</div>;
  }

  return <>{items.map(renderItem)}</>;
}

function EmptyState({
  icon,
  title,
  message,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid h-full min-h-[260px] place-items-center rounded-md text-center text-slate-500',
        compact && 'min-h-[220px]'
      )}
    >
      <div className="max-w-xs">
        <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
        <div className="font-semibold text-slate-700">{title}</div>
        <p className="mt-1 text-sm">{message}</p>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn('grid size-8 place-items-center rounded-md border border-slate-200 hover:bg-slate-50', className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-slate-500">
      <span>{label}</span>
      <span className="font-semibold text-slate-700">{formatMoney(value)}</span>
    </div>
  );
}

function AddressField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
