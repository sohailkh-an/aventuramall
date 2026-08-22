"use client";

import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
