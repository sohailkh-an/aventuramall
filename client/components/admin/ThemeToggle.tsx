'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useAdminTheme } from './AdminThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch admin to ${nextTheme} mode`}
      aria-pressed={isDark}
      title={`Switch to ${nextTheme} mode`}
      className="admin-theme-toggle group relative isolate grid h-11 w-[4.75rem] grid-cols-2 items-center overflow-hidden rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--admin-canvas)]"
    >
      <span
        aria-hidden="true"
        className={`admin-theme-toggle__thumb absolute left-1 top-1 h-9 w-9 rounded-full shadow-lg ${isDark ? 'translate-x-7' : 'translate-x-0'}`}
      />
      <SunMedium aria-hidden="true" className={`relative z-10 mx-auto h-4 w-4 ${isDark ? 'text-[var(--admin-text-muted)]' : 'text-amber-600'}`} />
      <MoonStar aria-hidden="true" className={`relative z-10 mx-auto h-4 w-4 ${isDark ? 'text-cyan-300' : 'text-[var(--admin-text-muted)]'}`} />
    </button>
  );
}
