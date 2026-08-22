'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ListTree,
  Store,
  Banknote,
  Users,
  UserCog,
  CreditCard,
  LifeBuoy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { name: 'POS System', href: '/admin/pos', icon: ListTree },
      { name: 'Sales', href: '/admin/sales', icon: Banknote },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Customer List', href: '/admin/customers/list', icon: Users },
      { name: 'Payout Requests', href: '/admin/customers/payout-requests', icon: CreditCard },
      { name: 'Payouts', href: '/admin/customers/payouts', icon: Banknote },
    ],
  },
  {
    label: 'Sellers',
    items: [
      { name: 'Seller List', href: '/admin/sellers/list', icon: Store },
      { name: 'Recharge Requests', href: '/admin/sellers/recharge-requests', icon: CreditCard },
      { name: 'Payout Requests', href: '/admin/sellers/payout-requests', icon: CreditCard },
      { name: 'Payouts', href: '/admin/sellers/payouts', icon: Banknote },
      { name: 'Seller Functions', href: '/admin/seller-functions', icon: UserCog },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Payment System', href: '/admin/payment', icon: CreditCard },
      { name: 'Support', href: '/admin/support', icon: LifeBuoy },
    ],
  },
];

export function Sidebar({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'admin-sidebar h-full min-h-0 flex flex-col shadow-xl overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 z-20 flex-shrink-0 text-slate-300',
        isCollapsed ? 'w-20' : 'w-[280px]'
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          'h-20 flex items-center border-b border-white/5',
          isCollapsed ? 'justify-center px-2' : 'px-5'
        )}
      >
        <div className={cn('relative', isCollapsed ? 'h-10 w-10' : 'h-12 w-full')}>
          <Image
            src="/new-logo.jpeg"
            alt="Galleria Mall Store Shop"
            fill
            sizes={isCollapsed ? '40px' : '240px'}
            className={cn('object-contain', isCollapsed && 'object-left')}
            priority
          />
        </div>
      </div>

      <nav className={cn('flex-1 py-5', isCollapsed ? 'px-3 space-y-5' : 'px-4 space-y-6')}>
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            {!isCollapsed && (
              <div className="px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {section.label}
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? `${section.label}: ${item.name}` : undefined}
                    className={cn(
                      'flex items-center rounded-lg text-[15px] transition-colors relative group',
                      isCollapsed ? 'justify-center px-0 py-3' : 'gap-4 px-4 py-3',
                      isActive
                        ? 'bg-white/10 text-white font-semibold shadow-[inset_3px_0_0_#FE2C55]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'flex-shrink-0',
                        isCollapsed ? 'w-6 h-6' : 'h-5 w-5',
                        isActive ? 'text-[#25F4EE]' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <style jsx global>{`
        aside.custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        aside.custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        aside.custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        aside.custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </aside>
  );
}
