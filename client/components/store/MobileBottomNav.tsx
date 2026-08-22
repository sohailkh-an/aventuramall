'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { Grid3X3, Heart, Home, ShoppingBag, UserRound } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { USER_MENU_ITEMS } from '@/components/store/user/UserSidebar';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Categories', href: '/search', icon: Grid3X3 },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { data: session } = useSession();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountHref = session?.user ? '/dashboard' : '/login';

  const handleAccountClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!session?.user) return;

    event.preventDefault();
    setIsAccountOpen(true);
  };

  return (
    <>
      <nav
        aria-label="Mobile storefront navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2 shadow-[0_-12px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
          {navItems.slice(0, 2).map((item) => (
            <BottomNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActivePath(pathname, item.href)}
            />
          ))}

          <Link
            href="/cart"
            aria-label={`Cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            className="group relative -mt-8 flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500"
          >
            <span className="relative grid h-16 w-16 place-items-center rounded-full border-[5px] border-white bg-brand text-brand-foreground shadow-[0_10px_26px_color-mix(in_oklab,var(--brand)_38%,transparent)] transition group-active:scale-95">
              <ShoppingBag className="h-7 w-7" strokeWidth={1.9} />
              {cartCount > 0 && (
                <span className="absolute -right-1 top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-slate-950 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
            <span className={cn('leading-none', isActivePath(pathname, '/cart') && 'text-brand')}>
              Cart ({cartCount})
            </span>
          </Link>

          <BottomNavLink
            href="/wishlist"
            label="Wishlist"
            icon={Heart}
            active={isActivePath(pathname, '/wishlist')}
          />
          <BottomNavLink
            href={accountHref}
            label="Account"
            icon={UserRound}
            active={pathname === '/login' || isActivePath(pathname, '/dashboard')}
            onClick={handleAccountClick}
          />
        </div>
      </nav>

      <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen}>
        <SheetContent
          side="left"
          className="z-[80] w-[86vw] max-w-sm gap-0 overflow-hidden bg-white p-0 text-slate-900 md:hidden"
        >
          <SheetHeader className="border-b border-slate-100 bg-gradient-to-br from-brand to-brand/80 p-5 text-brand-foreground">
            <SheetTitle className="text-lg font-black text-brand-foreground">Account</SheetTitle>
            <p className="text-sm font-medium text-brand-foreground/80">
              {session?.user?.name || session?.user?.email || 'Menu'}
            </p>
          </SheetHeader>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {USER_MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsAccountOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition-colors',
                    isActive ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-50 hover:text-brand'
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-slate-400')} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="rounded-sm bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BottomNavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold text-slate-500 transition active:scale-95',
        active && 'text-brand'
      )}
    >
      <Icon className={cn('h-5 w-5', active ? 'stroke-[2.3]' : 'stroke-[1.9]')} />
      <span className="max-w-full truncate leading-none">{label}</span>
    </Link>
  );
}
