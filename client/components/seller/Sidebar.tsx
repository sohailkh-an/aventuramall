'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  Tag,
  ClipboardList,
  Diamond,
  Store,
  Wallet,
  MessageSquare,
  Settings,
  Bell,
  Database,
  Search,
  FileText,
  Folder,
  Lock,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSellerSession } from '@/lib/seller-auth-client';
import { useQuery } from '@tanstack/react-query';
import { sellerApiGet, SellerOrdersSummary } from '@/lib/seller-orders';
import Image from 'next/image';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  hasSubmenu?: boolean;
  subItems?: { name: string; href: string }[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/seller/dashboard', icon: Home },
  {
    name: 'Products',
    href: '/seller/products',
    icon: ShoppingBag,
    hasSubmenu: true,
    subItems: [
      { name: 'Products', href: '/seller/products' },
      { name: 'Products Reviews', href: '/seller/products/reviews' },
    ],
  },
  { name: 'Product Storehouse', href: '/seller/storehouse', icon: Tag },
  { name: 'Orders', href: '/seller/orders', icon: ClipboardList },
  {
    name: 'Package',
    href: '/seller/package',
    icon: Diamond,
    hasSubmenu: true,
    subItems: [
      { name: 'Packages', href: '/seller/package' },
      { name: 'Purchased Packages', href: '/seller/package/purchased' },
    ],
  },
  {
    name: 'Spread Packages',
    href: '/seller/spread-packages',
    icon: Store,
    hasSubmenu: true,
    subItems: [
      { name: 'Spread Packages', href: '/seller/spread-packages' },
      { name: 'Purchased Spread Packages', href: '/seller/spread-packages/purchased' },
    ],
  },
  { name: 'Payments', href: '/seller/withdraw', icon: Wallet },
  // { name: 'Conversations', href: '/seller/conversations', icon: MessageSquare },
  { name: 'Shop Setting', href: '/seller/settings', icon: Settings },
  { name: 'Refunds', href: '/seller/refunds', icon: Bell },
  { name: 'Commission History', href: '/seller/commissions', icon: Database },
  { name: 'Product Queries', href: '/seller/queries', icon: Search },
  // { name: 'Support Ticket', href: '/seller/support', icon: FileText },
  { name: 'Uploaded Files', href: '/seller/files', icon: Folder },
  { name: 'Transaction Password', href: '/seller/password', icon: Lock, hasSubmenu: true },
];

export function Sidebar({
  isCollapsed = false,
  onNavigate,
}: {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSellerSession();
  const seller = session?.seller;
  const isVerified = seller?.status === 'APPROVED';
  const { data: orderSummaryData } = useQuery({
    queryKey: ['seller', 'orders', 'summary'],
    enabled: Boolean(seller),
    queryFn: () => sellerApiGet<{ data: SellerOrdersSummary }>('/api/seller/orders/summary'),
  });
  const orderBadge = orderSummaryData?.data.totalOrders || 0;

  return (
    <aside
      className={cn(
        'bg-card border-r border-border flex h-dvh flex-col pt-5 pb-10 shadow-card sticky top-0 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 z-20 flex-shrink-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Shop Profile Section */}
      <div className={cn('px-4 mb-8 flex flex-col items-center', isCollapsed ? 'mt-2' : '')}>
        <div
          className={cn(
            'relative rounded-full bg-muted overflow-hidden mb-3 border border-border flex items-center justify-center flex-shrink-0 transition-all duration-300',
            isCollapsed ? 'w-10 h-10' : 'w-16 h-16'
          )}
        >
          {seller?.shopLogo ? (
            <Image
              src={seller.shopLogo}
              alt="Shop Logo"
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <Store className={cn('text-muted-foreground', isCollapsed ? 'w-5 h-5' : 'w-8 h-8')} />
          )}
        </div>

        {!isCollapsed && (
          <div className="text-center w-full overflow-hidden flex flex-col items-center">
            <div className="flex items-center justify-center gap-1.5 w-full max-w-[180px]">
              <h2
                className="font-bold text-foreground text-[15px] truncate font-serif"
                title={seller?.shopName}
              >
                {seller?.shopName || 'Shop Name'}
              </h2>
              {isVerified && (
                <span
                  className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background"
                  title="Verified shop"
                  aria-label="Verified shop"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </div>
            <p
              className="text-xs text-muted-foreground truncate w-full max-w-[180px] mt-0.5"
              title={seller?.email}
            >
              {seller?.email || 'seller@example.com'}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.subItems && item.subItems.some((sub) => pathname === sub.href));
          const isExpanded = isActive;

          return (
            <div key={item.name} className="flex flex-col">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-md text-[14px] font-medium transition-colors relative group',
                  isActive && !item.subItems
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isActive && item.subItems
                      ? 'text-foreground bg-muted font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  isCollapsed ? 'justify-center' : 'justify-between'
                )}
                title={isCollapsed ? item.name : undefined}
                onClick={onNavigate}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      'flex-shrink-0',
                      isCollapsed ? 'w-5 h-5' : 'h-4 w-4',
                      isActive && !item.subItems
                        ? 'text-primary-foreground'
                        : isActive && item.subItems
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    )}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    {item.name === 'Orders' && (
                      <span className="bg-foreground text-background text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {orderBadge}
                      </span>
                    )}
                    {item.hasSubmenu && (
                      <ChevronLeft
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isActive && !item.subItems
                            ? 'text-primary-foreground/80'
                            : isActive && item.subItems
                              ? 'text-foreground/80 -rotate-90'
                              : 'text-muted-foreground/60'
                        )}
                      />
                    )}
                  </div>
                )}
              </Link>

              {/* Sub items */}
              {item.subItems && isExpanded && !isCollapsed && (
                <div className="mt-1 flex flex-col gap-1 ml-7 pl-3 border-l border-border">
                  {item.subItems.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                          isSubActive
                            ? 'text-foreground bg-muted font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        )}
                      >
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </aside>
  );
}
