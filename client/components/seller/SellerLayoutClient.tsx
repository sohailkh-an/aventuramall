"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/seller/Sidebar';
import { TopNav } from '@/components/seller/TopNav';
import { useSellerSession } from '@/lib/seller-auth-client';
import { Loader2 } from 'lucide-react';

export function SellerLayoutClient({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { data, isPending } = useSellerSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!data || !data.seller)) {
      router.push('/seller/login');
    }
  }, [data, isPending, router]);

  if (isPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data?.seller) {
    return null; // Prevent flash of content before redirect
  }

  const handleSidebarToggle = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsMobileSidebarOpen(true);
      return;
    }

    setIsCollapsed((value) => !value);
  };

  return (
    <div className="flex h-dvh bg-slate-50 overflow-hidden">
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} />
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close seller menu"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative h-full w-[min(88vw,20rem)] bg-white shadow-2xl">
            <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNav toggleSidebar={handleSidebarToggle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
