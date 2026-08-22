"use client";

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { AdminThemeProvider } from './AdminThemeProvider';

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAdminAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsSidebarCollapsed(true);
      } else {
        setIsMobile(false);
        setIsSidebarCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminThemeProvider>
      {/* Mobile Sidebar Overlay */}
      {isMobile && !isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-10 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar - fixed on mobile if open, locked in the viewport on desktop */}
      <div 
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-20 transition-transform duration-300' : 'relative z-20 h-full'}
          ${isMobile && isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <Sidebar isCollapsed={!isMobile && isSidebarCollapsed} />
      </div>

      <div className="flex-1 flex min-h-0 flex-col w-full min-w-0 overflow-hidden">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 custom-scrollbar w-full relative">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--admin-scrollbar);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--admin-scrollbar-hover);
        }
      `}</style>
    </AdminThemeProvider>
  );
}
