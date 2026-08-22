'use client';

import * as React from 'react';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThemePreset = 'aventura-editorial' | 'atelier-warm' | 'midnight-noir';

interface ThemeOption {
  id: ThemePreset;
  name: string;
  subtitle: string;
  previewClass: string;
  dotColor: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'aventura-editorial',
    name: 'Aventura Editorial',
    subtitle: 'Monochrome Luxury',
    previewClass: 'bg-white text-black border-zinc-200',
    dotColor: '#0A0A0A',
  },
  {
    id: 'atelier-warm',
    name: 'Atelier Warm',
    subtitle: 'Alabaster & Champagne',
    previewClass: 'bg-[#FAF8F5] text-[#1C1917] border-[#E7E2D7]',
    dotColor: '#C5A880',
  },
  {
    id: 'midnight-noir',
    name: 'Midnight Noir',
    subtitle: 'Obsidian & Platinum',
    previewClass: 'bg-[#09090B] text-[#FAFAFA] border-[#27272A]',
    dotColor: '#FAFAFA',
  },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = React.useState<ThemePreset>('aventura-editorial');
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('am_theme_preset') as ThemePreset | null;
    if (saved && ['aventura-editorial', 'atelier-warm', 'midnight-noir'].includes(saved)) {
      setCurrentTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'aventura-editorial');
    }
  }, []);

  const changeTheme = (themeId: ThemePreset) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('am_theme_preset', themeId);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="fixed bottom-6 right-6 z-50">
      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 bg-card text-card-foreground border border-border rounded-xl shadow-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Minimalist Prototypes
            </span>
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              Live Preview
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => changeTheme(theme.id)}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg border text-left transition-all duration-200 group',
                    isSelected
                      ? 'border-foreground/80 bg-muted/60 ring-1 ring-foreground/20'
                      : 'border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0"
                      style={{ backgroundColor: theme.dotColor }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold leading-none text-foreground">
                        {theme.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        {theme.subtitle}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-foreground shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-foreground text-background shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border border-foreground/10 text-xs font-semibold uppercase tracking-wider"
        title="Switch Design Prototype"
      >
        <Palette className="w-4 h-4 animate-spin-slow" />
        <span className="hidden sm:inline">Theme Prototype</span>
      </button>
    </div>
  );
}
