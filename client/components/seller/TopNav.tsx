"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Bell, User, LogOut, X } from 'lucide-react';
import { useSellerSession } from '@/lib/seller-auth-client';
import Link from 'next/link';
import Image from 'next/image';

export function TopNav({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { data: session, logout } = useSellerSession();
  const seller = session?.seller;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <header className="min-h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-3 py-3 sm:px-4 z-10 sticky top-0 flex-shrink-0">
      <button 
        onClick={toggleSidebar} 
        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
        aria-label="Toggle seller menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex min-w-0 items-center gap-2 sm:gap-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <span className="text-blue-500 font-medium text-sm hidden lg:inline-block whitespace-nowrap">
            Guarantee Money: <span className="font-bold">$0.00</span>
          </span>
          {/* <span className="hidden rounded-full border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 sm:inline-flex" title="United States">US</span> */}
        </div>

        <div className="flex min-w-0 items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 relative" ref={dropdownRef}>
          <button 
            className="flex min-w-0 items-center gap-2 sm:gap-3 focus:outline-none"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <div className="relative w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
              {seller?.shopLogo ? (
                <Image src={seller.shopLogo} alt="Avatar" fill className="object-cover" sizes="36px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-600 font-bold text-sm uppercase">
                  {seller?.shopName?.charAt(0) || seller?.name?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            <div className="hidden min-w-0 flex-col text-left sm:flex">
              <span className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[150px]">
                {seller?.shopName || 'Shop Name'}
              </span>
              <span className="text-xs text-slate-500 leading-tight">Seller</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
              <Link 
                href="/seller/profile" 
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <button 
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setDropdownOpen(false);
                  setLogoutModalOpen(true);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {logoutModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Confirm Logout</h3>
              <button onClick={() => setLogoutModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-center">Are you sure you want to log out of your seller account?</p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
