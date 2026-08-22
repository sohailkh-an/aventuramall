"use client";

import React, { useState, useEffect, useCallback, useContext, createContext, useRef, useMemo } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

interface SessionData {
  user: User | null;
}

interface SessionContextType {
  data: SessionData | null;
  isPending: boolean;
  error: any;
  refresh: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────
const SessionContext = createContext<SessionContextType | null>(null);

// ─── Sign In ───────────────────────────────────────────────────────
export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
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

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Network error' } };
    }
  }
};

// ─── Sign Up ───────────────────────────────────────────────────────
export const signUp = {
  email: async ({ email, password, name }: { email: string; password: string; name: string }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: { message: data.error || 'Registration failed' } };
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Network error' } };
    }
  }
};

// ─── Sign Out ──────────────────────────────────────────────────────
export const signOut = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    // Even if logout fails, clear local storage
  } finally {
    localStorage.removeItem('auth_token');
  }
};

// ─── Raw session fetch (internal) ──────────────────────────────────
const fetchSessionFromServer = async (): Promise<{ user: User | null; error: any }> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { user: null, error: null };
    }

    const response = await fetch(`${API_BASE}/api/auth/session`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Token invalid, remove it
      localStorage.removeItem('auth_token');
      return { user: null, error: { message: data.error || 'Invalid session' } };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: { message: 'Network error' } };
  }
};

// ─── Auth Provider ─────────────────────────────────────────────────
// Wraps the app and provides a single shared session to all consumers.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SessionData | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);
  const isFetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setIsPending(true);
      const result = await fetchSessionFromServer();
      setData({ user: result.user });
      setError(result.error);
    } catch (err) {
      setError({ message: 'Failed to fetch session' });
    } finally {
      setIsPending(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for storage changes (multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  const value = useMemo(
    () => ({ data, isPending, error, refresh }),
    [data, isPending, error, refresh]
  );

  return React.createElement(SessionContext.Provider, { value }, children);
}

// ─── useSession hook ───────────────────────────────────────────────
// Now reads from the shared context instead of making its own API call.
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within an <AuthProvider>. Wrap your app in <AuthProvider>.');
  }
  return context;
}

// ─── Standalone getSession (for one-off checks outside React) ──────
export const getSession = fetchSessionFromServer;

// ─── Helper function to get auth token for API calls ───────────────
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// ─── Helper function to make authenticated API calls ───────────────
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
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
