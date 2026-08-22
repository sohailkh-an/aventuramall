"use client";

import React, { useState, useEffect, useCallback, useContext, createContext, useRef, useMemo } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Seller {
  id: string;
  email: string;
  shopLogo: string;
  name: string;
  shopName: string;
  status: string;
  sellerPackage?: {
    id: string;
    code: string;
    name: string;
    productLimit: number;
    profitPercent: number | string;
  } | null;
}

export interface SellerSessionData {
  seller: Seller | null;
}

interface SellerSessionContextType {
  data: SellerSessionData | null;
  isPending: boolean;
  error: any;
  refresh: () => Promise<void>;
  logout: () => void;
}

const SellerSessionContext = createContext<SellerSessionContextType | null>(null);

export const sellerSignIn = async ({ email, password }: { email: string; password: string }) => {
  try {
    const response = await fetch(`${API_BASE}/api/seller/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Login failed' } };
    }

    localStorage.setItem('seller_auth_token', data.token);

    return { data, error: null };
  } catch (error) {
    return { data: null, error: { message: 'Network error' } };
  }
};

export const sellerSignOut = () => {
  localStorage.removeItem('seller_auth_token');
  window.location.href = '/seller/login';
};

const fetchSellerSession = async (): Promise<{ seller: Seller | null; error: any }> => {
  try {
    const token = localStorage.getItem('seller_auth_token');
    if (!token) {
      return { seller: null, error: null };
    }

    const response = await fetch(`${API_BASE}/api/seller/session`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      localStorage.removeItem('seller_auth_token');
      return { seller: null, error: { message: data.error || 'Invalid session' } };
    }

    return {
      seller: data.seller,
      error: null
    };
  } catch (error) {
    return { seller: null, error: { message: 'Network error' } };
  }
};

export function SellerAuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SellerSessionData | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);
  const isFetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setIsPending(true);
      const result = await fetchSellerSession();
      setData({ seller: result.seller });
      setError(result.error);
    } catch (err) {
      setError({ message: 'Failed to fetch seller session' });
    } finally {
      setIsPending(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'seller_auth_token') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  const value = useMemo(
    () => ({ data, isPending, error, refresh, logout: sellerSignOut }),
    [data, isPending, error, refresh]
  );

  return React.createElement(SellerSessionContext.Provider, { value }, children);
}

export function useSellerSession() {
  const context = useContext(SellerSessionContext);
  if (!context) {
    throw new Error('useSellerSession must be used within an <SellerAuthProvider>');
  }
  return context;
}

export const getSellerAuthToken = (): string | null => {
  return localStorage.getItem('seller_auth_token');
};

export const sellerAuthFetch = async (url: string, options: RequestInit = {}) => {
  const token = getSellerAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
