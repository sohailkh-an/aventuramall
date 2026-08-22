export const ADMIN_THEME_STORAGE_KEY = 'admin-theme';

export type AdminTheme = 'light' | 'dark';

export function isAdminTheme(value: unknown): value is AdminTheme {
  return value === 'light' || value === 'dark';
}

export function resolveAdminTheme(storedValue: unknown, systemPrefersDark: boolean): AdminTheme {
  if (isAdminTheme(storedValue)) return storedValue;
  return systemPrefersDark ? 'dark' : 'light';
}
