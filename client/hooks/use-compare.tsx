'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@aventuramall/shared';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => Promise<void>;
  removeFromCompare: (productId: string) => Promise<void>;
  clearCompare: () => Promise<void>;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

type CompareApiResponse = {
  data: Array<{ product: Product }>;
};

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: session, isPending: sessionPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const sanitizeProduct = (product: any): Product => {
    let images = product.images || [];
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch {
        images = [images];
      }
    }
    return { ...product, images };
  };

  const loadSavedCompareItems = (): Product[] => {
    if (typeof window === 'undefined') return [];
    const savedCompare = localStorage.getItem('compare-items');
    if (!savedCompare) return [];

    try {
      const parsed = JSON.parse(savedCompare);
      return Array.isArray(parsed) ? parsed.map(sanitizeProduct) : [];
    } catch (error) {
      console.error('Failed to parse compare items from localStorage', error);
      return [];
    }
  };

  useEffect(() => {
    if (sessionPending) return;

    const initialize = async () => {
      const savedCompare = loadSavedCompareItems();

      const fetchRemoteCompareItems = async (): Promise<Product[]> => {
        const res = await apiClient.get<CompareApiResponse>('/api/compare');
        return res.data.map((item) => sanitizeProduct(item.product));
      };

      const synchronizeCompareItems = async (localItems: Product[]) => {
        const serverItems = await fetchRemoteCompareItems();
        const serverIds = new Set(serverItems.map((item) => item.id));
        const missingItems = localItems.filter((item) => !serverIds.has(item.id));

        if (!missingItems.length) {
          return serverItems;
        }

        const spaceLeft = Math.max(0, 5 - serverItems.length);
        const itemsToSync = missingItems.slice(0, spaceLeft);

        for (const item of itemsToSync) {
          await apiClient.post('/api/compare', { productId: item.id });
        }

        return fetchRemoteCompareItems();
      };

      if (isAuthenticated) {
        try {
          const compareFromServer = await synchronizeCompareItems(savedCompare);
          setCompareItems(compareFromServer);
        } catch (error) {
          const apiError = error as { status?: number };
          if (apiError.status === 401 || apiError.status === 403) {
            setCompareItems(savedCompare);
          } else {
            console.error('Failed to load compare items', error);
            setCompareItems(savedCompare);
          }
        }
      } else {
        setCompareItems(savedCompare);
      }

      setIsInitialized(true);
    };

    initialize();
  }, [sessionPending, isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialized && !isAuthenticated) {
      localStorage.setItem('compare-items', JSON.stringify(compareItems));
    }
  }, [compareItems, isInitialized, isAuthenticated]);

  const addToCompare = async (product: Product) => {
    if (compareItems.some((item) => item.id === product.id)) {
      toast.info(`${product.name} is already in comparison`);
      return;
    }
    if (compareItems.length >= 5) {
      toast.error('Only 5 products can be added at max');
      return;
    }

    setCompareItems((prev) => [...prev, product]);
    toast.success(`${product.name} added to comparison`);

    if (isAuthenticated) {
      try {
        await apiClient.post('/api/compare', { productId: product.id });
      } catch {
        setCompareItems((prev) => prev.filter((item) => item.id !== product.id));
        toast.error(`Failed to add ${product.name} to comparison`);
      }
    }
  };

  const removeFromCompare = async (productId: string) => {
    const product = compareItems.find((i) => i.id === productId);
    if (!product) return;

    setCompareItems((prev) => prev.filter((item) => item.id !== productId));
    toast.info('Product removed from comparison');

    if (isAuthenticated) {
      try {
        await apiClient.delete(`/api/compare/${productId}`);
      } catch {
        setCompareItems((prev) => [...prev, product]);
        toast.error('Failed to remove product from comparison');
      }
    }
  };

  const clearCompare = async () => {
    const prev = [...compareItems];
    setCompareItems([]);
    toast.info('Comparison list cleared');

    if (isAuthenticated) {
      try {
        for (const item of prev) {
          await apiClient.delete(`/api/compare/${item.id}`);
        }
      } catch {
        setCompareItems(prev);
        toast.error('Failed to clear comparison list');
      }
    }
  };

  const isInCompare = (productId: string) => {
    return compareItems.some((item) => item.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
