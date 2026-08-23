export type SupportedCurrency = 'USD' | 'INR' | 'EUR' | 'CAD' | 'PKR';

type CurrencyConfig = {
  code: SupportedCurrency;
  label: string;
  locale: string;
  rate: number;
};

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', label: 'U.S. Dollar', locale: 'en-US', rate: 1 },
  // { code: 'INR', label: 'Indian Rupee', locale: 'en-IN', rate: 83.5 },
  { code: 'EUR', label: 'Euro', locale: 'de-DE', rate: 0.92 },
  { code: 'CAD', label: 'Canadian Dollar', locale: 'en-CA', rate: 1.37 },
  // { code: 'PKR', label: 'Pakistani Rupee', locale: 'en-PK', rate: 278 },
];

const currencyMap = new Map(CURRENCIES.map((currency) => [currency.code, currency]));

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return currencyMap.has(value as SupportedCurrency);
}

export function getCurrencyConfig(currency: SupportedCurrency) {
  return currencyMap.get(currency) ?? currencyMap.get(DEFAULT_CURRENCY)!;
}

export function convertPrice(amount: number, currency: SupportedCurrency) {
  return amount * getCurrencyConfig(currency).rate;
}

export function formatPrice(
  amount: number,
  currency: SupportedCurrency,
  options?: Intl.NumberFormatOptions
) {
  const config = getCurrencyConfig(currency);

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(convertPrice(amount, currency));
}

