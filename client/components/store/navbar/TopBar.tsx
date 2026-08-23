'use client';

import React, { useState } from 'react';
import { User, LogOut, LayoutDashboard, ChevronDown, Globe } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';
import { LogoutModal } from './LogoutModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/hooks/use-currency';

export function TopBar() {
  const { data: session, isPending } = useSession();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { currency, currencies, setCurrency } = useCurrency();

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="bg-muted/60 text-muted-foreground border-b border-border/50 text-[11px] font-medium tracking-wide transition-all duration-300 ease-in-out origin-top overflow-hidden group-[.is-scrolled]:max-h-0 group-[.is-scrolled]:border-transparent group-[.is-scrolled]:opacity-0 max-h-[100px]">
      <div className="container mx-auto px-4 py-1.5 flex justify-between items-center transition-all duration-300 group-[.is-scrolled]:py-0 group-[.is-scrolled]:scale-y-0">
        {/* Left Side: Currency */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent p-0 hover:text-foreground transition-colors uppercase tracking-wider text-[11px]">
                  <Globe className="w-3 h-3 opacity-70" />
                  <span>{currency}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              }
            />
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider font-semibold">
                Select Currency
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={currency}
                onValueChange={(value) => setCurrency(value as typeof currency)}
              >
                {currencies.map((item) => (
                  <DropdownMenuRadioItem key={item.code} value={item.code} className="text-xs">
                    {item.label} ({item.code})
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side: Auth */}
        <div className="flex items-center gap-4 sm:gap-6">


          {/* Auth links */}
          {isPending ? (
            <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent p-0 hover:text-foreground transition-colors uppercase tracking-wider text-[11px]">
                    <User className="w-3 h-3 opacity-70" />
                    <span>{session.user.name?.split(' ')[0] || 'Account'}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-48 mt-1">
                <DropdownMenuItem
                  render={
                    <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 text-xs">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>My Dashboard</span>
                    </Link>
                  }
                />
                <DropdownMenuItem
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hover:text-foreground transition-colors uppercase tracking-wider text-[11px]"
              >
                Sign In
              </Link>
              <span className="text-border">/</span>
              <Link
                href="/register"
                className="hover:text-foreground transition-colors uppercase tracking-wider text-[11px]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}

