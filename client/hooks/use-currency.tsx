'use client';

import React from 'react';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  convertPrice as convertCurrencyPrice,
  formatPrice as formatCurrencyPrice,
  isSupportedCurrency,
  type SupportedCurrency,
} from '@/lib/currency';

type CurrencyContextValue = {
  currency: SupportedCurrency;
  currencies: typeof CURRENCIES;
  setCurrency: (currency: SupportedCurrency) => void;
  formatPrice: (amount: number, options?: Intl.NumberFormatOptions) => string;
  convertPrice: (amount: number) => number;
};

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = 'storefront_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<SupportedCurrency>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_CURRENCY;
    }

    const storedCurrency = window.localStorage.getItem(STORAGE_KEY);
    return storedCurrency && isSupportedCurrency(storedCurrency)
      ? storedCurrency
      : DEFAULT_CURRENCY;
  });

  const setCurrency = React.useCallback((nextCurrency: SupportedCurrency) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
  }, []);

  const value = React.useMemo(
    () => ({
      currency,
      currencies: CURRENCIES,
      setCurrency,
      formatPrice: (amount: number, options?: Intl.NumberFormatOptions) =>
        formatCurrencyPrice(amount, currency, options),
      convertPrice: (amount: number) => Number(convertCurrencyPrice(amount, currency).toFixed(2)),
    }),
    [currency, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = React.useContext(CurrencyContext);

  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }

  return context;
}
