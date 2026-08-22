'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ADMIN_THEME_STORAGE_KEY,
  type AdminTheme,
  isAdminTheme,
  resolveAdminTheme,
} from '@/lib/admin-theme';

interface AdminThemeContextValue {
  theme: AdminTheme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    let storedValue: string | null = null;
    try {
      storedValue = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
    return resolveAdminTheme(storedValue, window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [hasManualPreference, setHasManualPreference] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return isAdminTheme(window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (!hasManualPreference) setTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', handleSystemThemeChange);
    return () => media.removeEventListener('change', handleSystemThemeChange);
  }, [hasManualPreference]);

  const value = useMemo<AdminThemeContextValue>(() => ({
    theme,
    toggleTheme: () => {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      setHasManualPreference(true);
      try {
        window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
      } catch {
        // The in-memory preference still works for the current session.
      }
    },
  }), [theme]);

  return (
    <AdminThemeContext.Provider value={value}>
      <div
        suppressHydrationWarning
        data-admin-theme={theme}
        data-admin-theme-source={hasManualPreference ? 'manual' : 'system'}
        className="admin-shell fixed inset-0 flex overflow-hidden"
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) throw new Error('useAdminTheme must be used within AdminThemeProvider');
  return context;
}
