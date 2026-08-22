import { sellerAuthFetch } from '@/lib/seller-auth-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SpreadPackage {
  id: string;
  code: string;
  name: string;
  price: number;
  durationDays: number;
  promotionLimit: number;
  description: string;
  sortOrder: number;
  isEnabled: boolean;
}

export interface SellerSpreadPackagePurchase {
  id: string;
  sellerId: string;
  spreadPackageId: string;
  packageName: string;
  pricePaid: number;
  durationDays: number;
  promotionLimit: number;
  purchasedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REPLACED' | 'EXPIRED';
  replacedAt: string | null;
  spreadPackage: SpreadPackage;
}

export interface SellerSpreadPackagesResponse {
  data: {
    packages: SpreadPackage[];
    currentPurchase: SellerSpreadPackagePurchase | null;
    walletBalance: number;
  };
}

export interface SellerSpreadPackagePurchasesResponse {
  data: SellerSpreadPackagePurchase[];
}

async function sellerSpreadPackageRequest<T>(path: string, init?: RequestInit) {
  const response = await sellerAuthFetch(`${API_BASE}${path}`, init);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || 'Something went wrong. Please try again.');
  }

  return body as T;
}

export function getSellerSpreadPackages() {
  return sellerSpreadPackageRequest<SellerSpreadPackagesResponse>(
    '/api/seller/spread-packages',
  );
}

export function getSellerSpreadPackagePurchases() {
  return sellerSpreadPackageRequest<SellerSpreadPackagePurchasesResponse>(
    '/api/seller/spread-packages/purchases',
  );
}

export function purchaseSellerSpreadPackage(packageId: string) {
  return sellerSpreadPackageRequest<{
    data: {
      purchase: SellerSpreadPackagePurchase;
      walletBalance: number;
    };
  }>(`/api/seller/spread-packages/${encodeURIComponent(packageId)}/purchase`, {
    method: 'POST',
  });
}
