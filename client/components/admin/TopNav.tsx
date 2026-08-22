"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Bell, User, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiClient } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';

export function TopNav({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { admin } = useAdminAuth();
  
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

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/admin/auth/logout');
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout failed', error);
      window.location.href = '/admin/login';
    }
  };

  return (
    <header className="admin-topnav sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b px-3 shadow-sm sm:px-4">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <ThemeToggle />
        <div className="flex items-center">
          <button className="text-slate-500 hover:text-slate-700 transition-colors relative p-2 rounded-full hover:bg-slate-100">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>

        <div className="flex items-center pl-4 border-l border-slate-200 relative" ref={dropdownRef}>
          <button 
            className="flex items-center gap-3 focus:outline-none rounded-full p-1 pr-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 border border-blue-200 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col hidden sm:flex text-left">
              <span className="text-sm font-bold text-slate-800 leading-tight">
                {admin?.name || 'Admin User'}
              </span>
              <span className="text-xs text-slate-500 leading-tight">{admin?.role || 'Staff'}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-bold text-slate-800">Admin User</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <Link 
                href="/admin/profile" 
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </Link>
              <button 
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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

      {typeof document !== 'undefined' && logoutModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Confirm Logout</h3>
              <button onClick={() => setLogoutModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-center">Are you sure you want to log out of the admin panel?</p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none transition-colors shadow-sm"
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
