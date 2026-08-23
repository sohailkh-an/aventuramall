'use client';

import React from 'react';
import { Search, Heart, RefreshCw, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { useCompare } from '@/hooks/use-compare';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useRouter } from 'next/navigation';

export function MainHeader() {
  const { compareItems } = useCompare();
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [searchTerm, setSearchTerm] = React.useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="bg-background text-foreground border-b border-border/40 py-5 group-[.is-scrolled]:py-2.5 transition-all duration-300 ease-in-out">
      <div className="container mx-auto px-4 flex items-center justify-between gap-6">
        {/* Left: Minimal Search */}
        <div className="hidden lg:flex items-center w-72">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH CURATED PIECES..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-muted/30 border-border rounded-full placeholder:text-muted-foreground/70 placeholder:text-[11px] placeholder:tracking-wider focus-visible:ring-1 focus-visible:ring-foreground/20"
            />
          </form>
        </div>

        {/* Center: Luxury Aventura Mall Logo */}
        <div className="flex-1 lg:flex-none flex justify-start lg:justify-center">
          <Link href="/" className="transition-opacity hover:opacity-85 flex items-center justify-center">
            <Logo className="h-9 sm:h-10 group-[.is-scrolled]:h-7 group-[.is-scrolled]:sm:h-8 w-auto transition-all duration-300 ease-in-out" />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {/* Mobile Search Icon */}
          <Link
            href="/search"
            className="lg:hidden p-2 rounded-full hover:bg-muted text-foreground transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Compare */}
          <Link
            href="/compare"
            className="flex items-center gap-1.5 group relative p-1.5 text-foreground/80 hover:text-foreground transition-colors"
            title="Compare Products"
          >
            <div className="relative">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-45" />
              {compareItems.length > 0 && (
                <Badge variant="notification">{compareItems.length}</Badge>
              )}
            </div>
            <span className="hidden xl:inline text-xs uppercase tracking-widest font-medium">
              Compare
            </span>
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="flex items-center gap-1.5 group relative p-1.5 text-foreground/80 hover:text-foreground transition-colors"
            title="My Wishlist"
          >
            <div className="relative">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
              {wishlistItems.length > 0 && (
                <Badge variant="notification">{wishlistItems.length}</Badge>
              )}
            </div>
            <span className="hidden xl:inline text-xs uppercase tracking-widest font-medium">
              Wishlist
            </span>
          </Link>

          {/* Shopping Bag / Cart */}
          <Link
            href="/cart"
            className="flex items-center gap-1.5 group relative p-1.5 text-foreground hover:opacity-90 transition-opacity"
            title="Shopping Bag"
          >
            <div className="relative p-2 bg-primary text-primary-foreground rounded-full shadow-sm">
              <ShoppingBag className="w-4 h-4 sm:w-4 sm:h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-foreground text-brand text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-primary">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden xl:inline text-xs uppercase tracking-widest font-semibold">
              Bag ({cartCount})
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

