"use client";

import React, { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <LogOut className="h-8 w-8" />
          </div>

          <h3 className="mb-2 text-2xl font-bold text-zinc-900">
            Sign Out
          </h3>
          <p className="mb-8 text-zinc-500">
            Are you sure you want to sign out of your account? You will need to log in again to access your wishlist and cart.
          </p>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-32 py-6 rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium transition-all active:scale-[0.98]"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="w-full sm:w-32 py-6 rounded-xl bg-brand hover:bg-brand/90 text-white font-medium transition-all active:scale-[0.98] shadow-lg shadow-brand/20"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
