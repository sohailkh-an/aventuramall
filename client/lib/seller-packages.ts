import { sellerAuthFetch } from '@/lib/seller-auth-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SellerPackage {
  id: string;
  code: string;
  name: string;
  productLimit: number;
  profitPercent: number;
  price: number;
  sortOrder: number;
}

export interface SellerPackagePurchase {
  id: string;
  packageName: string;
  pricePaid: number;
  productLimit: number;
  profitPercent: number;
  paymentType: string;
  purchasedAt: string;
  sellerPackage: SellerPackage;
}

export interface SellerPackagesResponse {
  data: {
    packages: SellerPackage[];
    currentPackage: SellerPackage | null;
    walletBalance: number;
  };
}

async function sellerPackageRequest<T>(path: string, init?: RequestInit) {
  const response = await sellerAuthFetch(`${API_BASE}${path}`, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Something went wrong. Please try again.');
  return body as T;
}

export function getSellerPackages() {
  return sellerPackageRequest<SellerPackagesResponse>('/api/seller/packages');
}

export function getSellerPackagePurchases() {
  return sellerPackageRequest<{ data: SellerPackagePurchase[] }>('/api/seller/packages/purchases');
}

export function purchaseSellerPackage(packageId: string) {
  return sellerPackageRequest<{
    data: { purchase: SellerPackagePurchase; currentPackage: SellerPackage; walletBalance: number };
  }>(`/api/seller/packages/${encodeURIComponent(packageId)}/purchase`, { method: 'POST' });
}
