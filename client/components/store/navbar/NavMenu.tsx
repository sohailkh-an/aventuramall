'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Store,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRANDS } from '@/components/store/HomeBrands';
import { CATEGORIES } from '@/components/store/HomeCategories';

interface Category {
  id?: string;
  name: string;
  slug: string;
}

interface NavMenuProps {
  categories?: Category[];
}

// Curated top brands to display in the dropdown (fits nicely in viewport)
const FEATURED_BRANDS_1 = [
  { name: 'Apple', slug: 'apple' },
  { name: 'Rolex', slug: 'rolex' },
  { name: 'Adidas', slug: 'adidas' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'SEPHORA', slug: 'sephora' },
  { name: 'Sony', slug: 'sony' },
  { name: 'Puma', slug: 'puma' },
  { name: 'Toyota', slug: 'toyota' },
];

const FEATURED_BRANDS_2 = [
  { name: "Victoria's Secret", slug: 'victorias-secret' },
  { name: 'Aigner', slug: 'aigner' },
  { name: 'ASUS', slug: 'asus' },
  { name: 'Philips', slug: 'philips' },
  { name: 'Volvo', slug: 'volvo' },
  { name: 'Yamaha', slug: 'yamaha' },
  { name: 'ACER', slug: 'acer' },
  { name: 'Reebok', slug: 'reebok' },
];

export function NavMenu({ categories = [] }: NavMenuProps) {
  const [activeMegaMenu, setActiveMegaMenu] = useState<'categories' | 'brands' | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<'categories' | 'brands' | null>('categories');

  const displayCategories: Category[] = useMemo(() => {
    if (categories.length > 0) {
      return categories;
    }
    return CATEGORIES;
  }, [categories]);

  return (
    <div
      className="bg-background text-foreground border-b border-border/60 relative z-40 transition-colors duration-200"
      onMouseLeave={() => setActiveMegaMenu(null)}
    >
      <div className="container mx-auto px-4">
        {/* Desktop Luxury Nav Bar */}
        <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12 py-3 group-[.is-scrolled]:py-1.5 transition-all duration-300 ease-in-out text-[12px] font-semibold uppercase tracking-[0.18em]">
          {/* CATEGORIES with Mega Menu */}
          <div
            className="relative py-2 group cursor-pointer"
            onMouseEnter={() => setActiveMegaMenu('categories')}
          >
            <button
              type="button"
              className={cn(
                'flex items-center gap-1.5 transition-colors underline-offset-8 group-hover:underline',
                activeMegaMenu === 'categories' ? 'text-primary underline font-bold' : 'hover:text-foreground/70'
              )}
            >
              <span>CATEGORIES</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200 opacity-60',
                  activeMegaMenu === 'categories' ? 'rotate-180 opacity-100 text-primary' : ''
                )}
              />
            </button>
          </div>

          {/* BRANDS with Mega Menu */}
          <div
            className="relative py-2 group cursor-pointer"
            onMouseEnter={() => setActiveMegaMenu('brands')}
          >
            <button
              type="button"
              className={cn(
                'flex items-center gap-1.5 transition-colors underline-offset-8 group-hover:underline',
                activeMegaMenu === 'brands' ? 'text-primary underline font-bold' : 'hover:text-foreground/70'
              )}
            >
              <span>BRANDS</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200 opacity-60',
                  activeMegaMenu === 'brands' ? 'rotate-180 opacity-100 text-primary' : ''
                )}
              />
            </button>
          </div>

          {/* CURATED */}
          <Link
            href="/search?sort=popular"
            className="py-2 hover:text-foreground/70 transition-colors underline-offset-8 hover:underline"
          >
            CURATED
          </Link>

          {/* EDITORIAL & JOURNAL */}
          <Link
            href="/blogs"
            className="py-2 hover:text-foreground/70 transition-colors underline-offset-8 hover:underline"
          >
            EDITORIAL & JOURNAL
          </Link>

          {/* PARTNER WITH US */}
          <Link
            href="/seller/register"
            className="py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            PARTNER WITH US
          </Link>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center justify-between py-3 group-[.is-scrolled]:py-1.5 transition-all duration-300 ease-in-out">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
            EXPLORE DIRECTORY
          </span>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded border border-border text-foreground hover:bg-muted focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ============================================================
          CATEGORIES MEGA MENU DROPDOWN PANEL (Solid Background & Compact)
          ============================================================ */}
      {activeMegaMenu === 'categories' && (
        <div
          className="hidden md:block absolute top-full left-0 w-full bg-background border-b border-border shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 z-50"
          onMouseEnter={() => setActiveMegaMenu('categories')}
          onMouseLeave={() => setActiveMegaMenu(null)}
        >
          <div className="container mx-auto px-6 py-7">
            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Column 1: Real Categories (ALL CAPS, No Icons) */}
              <div className="col-span-5 flex flex-col gap-3 border-r border-border/50 pr-6">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
                    DEPARTMENTS
                  </h4>
                  <Link
                    href="/search"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <span>VIEW ALL</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                  {displayCategories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/search?category=${encodeURIComponent(category.slug)}`}
                      onClick={() => setActiveMegaMenu(null)}
                      className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground group-hover:underline underline-offset-4 transition-colors">
                        {category.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 group-hover:text-foreground transition-colors">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 2: Curated Edits */}
              <div className="col-span-4 flex flex-col gap-3 border-r border-border/50 pr-6">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  CURATED EDITS
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-xs font-medium">
                  <Link
                    href="/search?sort=newest"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider py-1 px-1.5 rounded hover:bg-muted/50 truncate"
                  >
                    NEW ARRIVALS
                  </Link>
                  <Link
                    href="/search?sort=popular"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider py-1 px-1.5 rounded hover:bg-muted/50 truncate"
                  >
                    BEST SELLERS
                  </Link>
                  <Link
                    href="/search?category=women-clothing-fashion"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider py-1 px-1.5 rounded hover:bg-muted/50 truncate"
                  >
                    HAUTE COUTURE
                  </Link>
                  <Link
                    href="/search?category=jewelry-watches"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider py-1 px-1.5 rounded hover:bg-muted/50 truncate"
                  >
                    FINE WATCHES
                  </Link>
                  <Link
                    href="/search?category=men-clothing-fashion"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider py-1 px-1.5 rounded hover:bg-muted/50 truncate"
                  >
                    TAILORED MEN
                  </Link>
                  <Link
                    href="/search?category=computer-accessories"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider py-1 px-1.5 rounded hover:bg-muted/50 truncate"
                  >
                    LUXURY AUDIO
                  </Link>
                </div>

                <div className="mt-2 p-2.5 bg-muted/40 rounded border border-border/60 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">
                    Complimentary concierge styling on all boutique collections.
                  </span>
                </div>
              </div>

              {/* Column 3: Compact Spotlight */}
              <div className="col-span-3 flex flex-col gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  SPOTLIGHT EDIT
                </h4>
                <div className="group relative overflow-hidden rounded border border-border/80 bg-card p-3 flex flex-col gap-2">
                  <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden rounded">
                    <Image
                      src="https://apexmallstore.top/public/uploads/all/SKD7fE5FhtdAONyHp7bkREechQFr7lM7vPJXJ2pu.jpg"
                      alt="Luxury Edit"
                      fill
                      sizes="280px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground font-serif">
                    HAUTE COUTURE EDIT
                  </span>
                  <Link
                    href="/search"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-[10px] font-bold uppercase tracking-wider text-foreground underline underline-offset-4 hover:opacity-75 flex items-center gap-1"
                  >
                    <span>EXPLORE ALL COLLECTIONS</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BRANDS MEGA MENU DROPDOWN PANEL (Solid Background & Curated)
          ============================================================ */}
      {activeMegaMenu === 'brands' && (
        <div
          className="hidden md:block absolute top-full left-0 w-full bg-background border-b border-border shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 z-50"
          onMouseEnter={() => setActiveMegaMenu('brands')}
          onMouseLeave={() => setActiveMegaMenu(null)}
        >
          <div className="container mx-auto px-6 py-7">
            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Column 1: Featured Maisons */}
              <div className="col-span-4 flex flex-col gap-3 border-r border-border/50 pr-6">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  FEATURED MAISONS
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                  {FEATURED_BRANDS_1.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={`/search?q=${encodeURIComponent(brand.name)}`}
                      onClick={() => setActiveMegaMenu(null)}
                      className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground group-hover:underline underline-offset-4 transition-colors uppercase tracking-wider truncate">
                        {brand.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 group-hover:text-foreground transition-colors">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 2: Iconic Brands */}
              <div className="col-span-4 flex flex-col gap-3 border-r border-border/50 pr-6">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  ICONIC BRANDS
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                  {FEATURED_BRANDS_2.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={`/search?q=${encodeURIComponent(brand.name)}`}
                      onClick={() => setActiveMegaMenu(null)}
                      className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground group-hover:underline underline-offset-4 transition-colors uppercase tracking-wider truncate">
                        {brand.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 group-hover:text-foreground transition-colors">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 3: Full Directory Card */}
              <div className="col-span-4 flex flex-col gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  FLAGSHIP DIRECTORY
                </h4>
                <div className="rounded border border-border/80 bg-card p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-foreground font-serif">
                      {BRANDS.length}+ PREMIER FLAGSHIPS
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Explore all international designer boutiques, electronics, cosmetics, and fine jeweler flagships.
                  </p>
                  <Link
                    href="/brands"
                    onClick={() => setActiveMegaMenu(null)}
                    className="text-xs font-bold uppercase tracking-wider text-foreground underline underline-offset-4 hover:opacity-75 flex items-center gap-1.5 pt-1"
                  >
                    <span>VIEW COMPLETE DIRECTORY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MOBILE NAVIGATION DRAWER (Solid Background)
          ============================================================ */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-6 animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
          {/* Mobile Tab Selectors */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={() => setMobileSection('categories')}
              className={cn(
                'py-2.5 px-3 rounded text-xs font-bold uppercase tracking-wider border transition-all text-center flex items-center justify-center gap-1.5',
                mobileSection === 'categories'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted/40 text-foreground border-border hover:bg-muted'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>CATEGORIES</span>
            </button>
            <button
              onClick={() => setMobileSection('brands')}
              className={cn(
                'py-2.5 px-3 rounded text-xs font-bold uppercase tracking-wider border transition-all text-center flex items-center justify-center gap-1.5',
                mobileSection === 'brands'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted/40 text-foreground border-border hover:bg-muted'
              )}
            >
              <Store className="w-3.5 h-3.5" />
              <span>BRANDS</span>
            </button>
          </div>

          {/* Section: Categories (No Icons, ALL CAPS) */}
          {mobileSection === 'categories' && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                DEPARTMENTS
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {displayCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/search?category=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded border border-border/80 bg-card hover:bg-muted text-xs font-bold uppercase tracking-wider text-foreground"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[11px] text-muted-foreground">→</span>
                  </Link>
                ))}
              </div>
              <Link
                href="/search"
                onClick={() => setIsMobileOpen(false)}
                className="mt-2 text-xs font-bold uppercase tracking-wider text-center py-2.5 border border-border rounded text-foreground hover:bg-muted"
              >
                VIEW ALL DEPARTMENTS
              </Link>
            </div>
          )}

          {/* Section: Brands (Curated Top Brands) */}
          {mobileSection === 'brands' && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                TOP BRAND FLAGSHIPS
              </span>

              {/* Top Brands Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {[...FEATURED_BRANDS_1, ...FEATURED_BRANDS_2].map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/search?q=${encodeURIComponent(brand.name)}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2.5 rounded border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground uppercase tracking-wider truncate flex items-center justify-between"
                  >
                    <span className="truncate">{brand.name}</span>
                    <span className="text-[10px] text-muted-foreground">→</span>
                  </Link>
                ))}
              </div>

              <Link
                href="/brands"
                onClick={() => setIsMobileOpen(false)}
                className="mt-2 text-xs font-bold uppercase tracking-wider text-center py-2.5 border border-border rounded text-foreground hover:bg-muted"
              >
                VIEW ALL {BRANDS.length} BRAND FLAGSHIPS →
              </Link>
            </div>
          )}

          {/* Direct Navigation Links */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              QUICK LINKS
            </span>
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="text-xs font-semibold uppercase tracking-wider text-foreground hover:opacity-80 py-1"
            >
              HOME
            </Link>
            <Link
              href="/search?sort=popular"
              onClick={() => setIsMobileOpen(false)}
              className="text-xs font-semibold uppercase tracking-wider text-foreground hover:opacity-80 py-1"
            >
              CURATED PIECES
            </Link>
            <Link
              href="/blogs"
              onClick={() => setIsMobileOpen(false)}
              className="text-xs font-semibold uppercase tracking-wider text-foreground hover:opacity-80 py-1"
            >
              EDITORIAL & JOURNAL
            </Link>
            <Link
              href="/brands"
              onClick={() => setIsMobileOpen(false)}
              className="text-xs font-semibold uppercase tracking-wider text-foreground hover:opacity-80 py-1"
            >
              BRAND DIRECTORY
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/seller/register"
              onClick={() => setIsMobileOpen(false)}
              className="w-full py-3 bg-primary text-primary-foreground text-center block rounded text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              BECOME A SELLER PARTNER
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

