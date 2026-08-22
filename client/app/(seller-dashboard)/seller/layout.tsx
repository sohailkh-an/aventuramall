import React from 'react';
import { SellerLayoutClient } from '@/components/seller/SellerLayoutClient';
import { ChatwootWidget } from '@/components/chat/ChatwootWidget';

export const metadata = {
  title: 'Seller Dashboard',
  description: 'Manage your shop and products',
};

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SellerLayoutClient>{children}</SellerLayoutClient>
      <ChatwootWidget />
    </>
  );
}
