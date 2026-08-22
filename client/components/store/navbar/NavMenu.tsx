'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURED_SHOPS = [
  'Dior',
  'Prada',
  'Alo Yoga',
  'Celine',
  'SKIMS',
  'Hermès',
  'Louis Vuitton',
  'Sephora',
  'Zara',
  'Apple',
  'Aritzia',
  'Massimo Dutti',
];

const COMING_SOON = [
  'Uniqlo',
  'Revolve',
  'On Running',
  'Gorjana',
  'Parfums de Marly',
  'Initio Parfums',
  'RIMOWA',
  'Stuart Weitzman',
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface NavMenuProps {
  categories?: Category[];
}

export function NavMenu({ categories = [] }: NavMenuProps) {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fallbackCategories = [
    { name: "What's New", slug: 'all' },
    { name: 'Womenswear & Accessories', slug: 'women-clothing-fashion' },
    { name: 'Menswear & Accessories', slug: 'men-clothing-fashion' },
    { name: 'Beauty & Fragrance', slug: 'beauty-fragrance' },
    { name: 'Jewelry & Watches', slug: 'jewelry-watches' },
    { name: 'Shoes & Leather Goods', slug: 'shoes' },
    { name: 'Home, Decor & Furniture', slug: 'home-decoration-appliances' },
    { name: 'Sporting Goods & Athletics', slug: 'sports-outdoor' },
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <div
      className="bg-background text-foreground border-b border-border/60 relative z-40 transition-colors duration-200"
      onMouseLeave={() => setActiveMegaMenu(null)}
    >
      <div className="container mx-auto px-4">
        {/* Desktop Luxury Nav Bar */}
        <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12 py-3 text-[12px] font-semibold uppercase tracking-[0.18em]">
          {/* SHOPS with Mega Menu */}
          <div
            className="relative py-2 group cursor-pointer"
            onMouseEnter={() => setActiveMegaMenu('shops')}
          >
            <button className="flex items-center gap-1 hover:text-foreground/70 transition-colors underline-offset-8 group-hover:underline">
              <span>Shops</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200 opacity-60',
                  activeMegaMenu === 'shops' ? 'rotate-180' : ''
                )}
              />
            </button>
          </div>

          {/* CATEGORIES with Mega Menu */}
          <div
            className="relative py-2 group cursor-pointer"
            onMouseEnter={() => setActiveMegaMenu('categories')}
          >
            <button className="flex items-center gap-1 hover:text-foreground/70 transition-colors underline-offset-8 group-hover:underline">
              <span>Categories</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200 opacity-60',
                  activeMegaMenu === 'categories' ? 'rotate-180' : ''
                )}
              />
            </button>
          </div>

          <Link
            href="/brands"
            className="py-2 hover:text-foreground/70 transition-colors underline-offset-8 hover:underline"
          >
            Brands
          </Link>

          <Link
            href="/search?sort=popular"
            className="py-2 hover:text-foreground/70 transition-colors underline-offset-8 hover:underline"
          >
            Curated
          </Link>

          <Link
            href="/blogs"
            className="py-2 hover:text-foreground/70 transition-colors underline-offset-8 hover:underline"
          >
            Editorial & Journal
          </Link>

          <Link
            href="/seller/register"
            className="py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Partner With Us
          </Link>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center justify-between py-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
            Explore Directory
          </span>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded border border-border text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ============================================================
          MEGA MENU DROPDOWN PANEL (Matching Aventura Mall Reference)
          ============================================================ */}
      {activeMegaMenu && (
        <div
          className="hidden md:block absolute top-full left-0 w-full bg-background border-b border-border shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200"
          onMouseEnter={() => setActiveMegaMenu(activeMegaMenu)}
          onMouseLeave={() => setActiveMegaMenu(null)}
        >
          <div className="container mx-auto px-6 py-10">
            <div className="grid grid-cols-4 gap-8">
              {/* Column 1: Featured Shops */}
              <div className="flex flex-col gap-4 border-r border-border/40 pr-6">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  Featured Boutiques
                </h4>
                <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {FEATURED_SHOPS.map((shop) => (
                    <li key={shop}>
                      <Link
                        href={`/search?q=${encodeURIComponent(shop)}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors block py-0.5"
                      >
                        {shop}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/brands"
                  onClick={() => setActiveMegaMenu(null)}
                  className="mt-3 text-xs font-bold uppercase tracking-wider text-foreground underline underline-offset-4 flex items-center gap-1 hover:opacity-75 transition-opacity"
                >
                  <span>View All Boutiques</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Column 2: Department Categories */}
              <div className="flex flex-col gap-4 border-r border-border/40 pr-6">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  Departments
                </h4>
                <ul className="flex flex-col gap-2">
                  {displayCategories.slice(0, 7).map((cat) => (
                    <li key={cat.slug || cat.name}>
                      <Link
                        href={`/search?category=${cat.slug}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors block py-0.5"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/search"
                  onClick={() => setActiveMegaMenu(null)}
                  className="mt-auto text-xs font-bold uppercase tracking-wider text-foreground underline underline-offset-4 flex items-center gap-1 hover:opacity-75 transition-opacity"
                >
                  <span>All Collections</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Column 3: Coming Soon / Highlights */}
              <div className="flex flex-col gap-4 border-r border-border/40 pr-6">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  Coming Soon
                </h4>
                <ul className="flex flex-col gap-2">
                  {COMING_SOON.slice(0, 6).map((item) => (
                    <li key={item}>
                      <span className="text-xs font-normal text-muted-foreground block py-0.5">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  <div className="p-3 bg-muted/40 rounded border border-border/60 flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-foreground/70 shrink-0" />
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      New luxury flagships opening this season at Aventura.
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 4: Editorial Showcase Card (Like Dior in reference) */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/60">
                  Spotlight
                </h4>
                <div className="group relative overflow-hidden rounded border border-border/80 bg-card">
                  <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden">
                    <Image
                      src="https://apexmallstore.top/public/uploads/all/SKD7fE5FhtdAONyHp7bkREechQFr7lM7vPJXJ2pu.jpg"
                      alt="Dior Flagship"
                      fill
                      sizes="300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-foreground font-serif">
                      DIOR
                    </span>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      Defining modern luxury through timeless innovation, haute couture, and fine craftsmanship.
                    </p>
                    <Link
                      href="/search?q=Dior"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold uppercase tracking-wider text-foreground underline underline-offset-4 mt-2 hover:opacity-75"
                    >
                      Explore Maison
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          Mobile Menu Slide-Out
          ============================================================ */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Navigation
            </span>
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="text-lg font-serif font-bold text-foreground hover:opacity-80"
            >
              Home
            </Link>
            <Link
              href="/search"
              onClick={() => setIsMobileOpen(false)}
              className="text-lg font-serif font-bold text-foreground hover:opacity-80"
            >
              All Shops & Boutiques
            </Link>
            <Link
              href="/brands"
              onClick={() => setIsMobileOpen(false)}
              className="text-lg font-serif font-bold text-foreground hover:opacity-80"
            >
              Brand Directory
            </Link>
            <Link
              href="/blogs"
              onClick={() => setIsMobileOpen(false)}
              className="text-lg font-serif font-bold text-foreground hover:opacity-80"
            >
              Editorial & News
            </Link>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Top Categories
            </span>
            <div className="grid grid-cols-2 gap-2">
              {displayCategories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/search?category=${cat.slug}`}
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2.5 rounded border border-border text-xs font-medium text-foreground hover:bg-muted"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Link
              href="/seller/register"
              onClick={() => setIsMobileOpen(false)}
              className="w-full py-3 bg-primary text-primary-foreground text-center block rounded text-xs font-bold uppercase tracking-widest"
            >
              Become A Seller Partner
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

