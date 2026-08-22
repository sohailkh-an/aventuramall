'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@aventuramall/shared';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

interface WishlistContextType {
  wishlistItems: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: session, isPending: sessionPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const loadSavedWishlistItems = (): Product[] => {
    if (typeof window === 'undefined') return [];
    const savedWishlist = localStorage.getItem('wishlist-items');
    if (!savedWishlist) return [];

    try {
      return JSON.parse(savedWishlist);
    } catch (error) {
      console.error('Failed to parse wishlist items from localStorage', error);
      return [];
    }
  };

  const fetchRemoteWishlistItems = async (): Promise<Product[]> => {
    const res: any = await apiClient.get('/api/wishlist');
    return res.data.map((item: any) => item.product);
  };

  const synchronizeWishlistItems = async (localItems: Product[]) => {
    const serverItems = await fetchRemoteWishlistItems();
    const serverIds = new Set(serverItems.map((item) => item.id));
    const missingItems = localItems.filter((item) => !serverIds.has(item.id));

    if (!missingItems.length) {
      return serverItems;
    }

    for (const item of missingItems) {
      await apiClient.post('/api/wishlist', { productId: item.id });
    }

    return fetchRemoteWishlistItems();
  };

  useEffect(() => {
    if (sessionPending) return;

    const initialize = async () => {
      const savedWishlist = loadSavedWishlistItems();

      if (isAuthenticated) {
        try {
          const wishlistFromServer = await synchronizeWishlistItems(savedWishlist);
          setWishlistItems(wishlistFromServer);
        } catch (error: any) {
          if (error.status === 401 || error.status === 403) {
            setWishlistItems(savedWishlist);
          } else {
            console.error('Failed to load wishlist items', error);
            setWishlistItems(savedWishlist);
          }
        }
      } else {
        setWishlistItems(savedWishlist);
      }

      setIsInitialized(true);
    };

    initialize();
  }, [sessionPending, isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialized && !isAuthenticated) {
      localStorage.setItem('wishlist-items', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isInitialized, isAuthenticated]);

  const toggleWishlist = async (product: Product) => {
    const exists = wishlistItems.some((item) => item.id === product.id);

    // Optimistic UI update
    setWishlistItems((prev) => {
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });

    if (exists) {
      toast.info(`${product.name} removed from wishlist`);
      if (isAuthenticated) {
        try {
          await apiClient.delete(`/api/wishlist/${product.id}`);
        } catch (error) {
          setWishlistItems((prev) => [...prev, product]); // revert
          toast.error(`Failed to remove ${product.name}`);
        }
      }
    } else {
      toast.success(`${product.name} added to wishlist`);
      if (isAuthenticated) {
        try {
          await apiClient.post('/api/wishlist', { productId: product.id });
        } catch (error) {
          setWishlistItems((prev) => prev.filter((item) => item.id !== product.id)); // revert
          toast.error(`Failed to add ${product.name}`);
        }
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const product = wishlistItems.find((i) => i.id === productId);
    if (!product) return;

    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
    toast.info('Product removed from wishlist');

    if (isAuthenticated) {
      try {
        await apiClient.delete(`/api/wishlist/${productId}`);
      } catch (error) {
        setWishlistItems((prev) => [...prev, product]);
        toast.error('Failed to remove product');
      }
    }
  };

  const clearWishlist = async () => {
    const prev = [...wishlistItems];
    setWishlistItems([]);
    toast.info('Wishlist cleared');

    if (isAuthenticated) {
      try {
        for (const item of prev) {
          await apiClient.delete(`/api/wishlist/${item.id}`);
        }
      } catch (error) {
        setWishlistItems(prev);
        toast.error('Failed to clear wishlist');
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
