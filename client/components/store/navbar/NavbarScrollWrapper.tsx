'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function NavbarScrollWrapper({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 30) {
        setIsScrolled(false);
      } else {
        if (currentScrollY > lastScrollY.current) {
          setIsScrolled(true); // scrolling down
        } else if (currentScrollY < lastScrollY.current - 10) {
          setIsScrolled(false); // scrolling up
        }
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "flex flex-col w-full sticky top-0 z-40 bg-background/95 backdrop-blur-md transition-all duration-300 group",
      isScrolled ? "is-scrolled shadow-sm" : ""
    )}>
      {children}
    </nav>
  );
}
