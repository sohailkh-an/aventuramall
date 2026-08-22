'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail } from 'lucide-react';

const BOUTIQUE_SERVICES = [
  { label: 'Concierge & Styling', href: '/concierge' },
  { label: 'Boutique Directory', href: '/brands' },
  { label: 'Dining & Experiences', href: '/dining' },
  { label: 'Arts & Cultural Exhibits', href: '/arts' },
  { label: 'Mall Map & Parking', href: '/visit' },
];

const CUSTOMER_CARE = [
  { label: 'Client Support', href: '/support-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Return & Exchange Policy', href: '/return-policy' },
  { label: 'Privacy & Cookies', href: '/privacy-policy' },
];

const MAISON_PARTNERS = [
  { label: 'Become A Seller Partner', href: '/seller/register' },
  { label: 'Seller Portal Login', href: '/seller/login' },
  { label: 'Track Client Order', href: '/track' },
  { label: 'Personal Dashboard', href: '/dashboard' },
];

const PAYMENT_LOGOS = [
  'https://apexmallstore.top/public/uploads/all/mRpGcJYS6ka1CkhqdiQ9TLVcbDoAUHGnFiGNKARk.png',
  'https://apexmallstore.top/public/uploads/all/nSN17CnWvmQdxApp2denkxLlEdAifubMMPPu5u1z.png',
  'https://apexmallstore.top/public/uploads/all/c8sUmBCAcrN4vA7GVNOzGEL8DWBS3L6swmr69xSu.png',
  'https://apexmallstore.top/public/uploads/all/Cz2GVNLy7gzhixGsVVl8X984ZFAOn3aNmSBZPkIE.png',
  'https://apexmallstore.top/public/uploads/all/TzeA5BOLztsPRacnso7IKXFb09N5ohbE6Ds7b1MD.png',
  'https://apexmallstore.top/public/uploads/all/yrx4Bave7Vs499rTcNJcSuEregDsbreYhLBGVmWu.png',
];

export function Footer() {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="bg-card/40 border-t border-border/80 pt-16 pb-12 text-foreground transition-colors duration-200">
      <div className="container mx-auto px-4">
        {/* Top Section: Brand Statement & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-14 border-b border-border/60">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center">
              <Link href="/">
                <Logo className="h-10 w-auto" />
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm font-light mt-1">
              Aventura Mall is the premier luxury shopping destination in South Florida, featuring iconic fashion houses, fine jewelry, cutting-edge art installations, and chef-driven dining.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-3 justify-center">
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-foreground">
              Aventura Gazette & Private Previews
            </span>
            <p className="text-xs text-muted-foreground">
              Subscribe to receive private invitations to runway releases, boutique openings, and curated edits.
            </p>
            {subscribed ? (
              <div className="p-3 bg-muted/60 rounded text-xs font-semibold text-foreground border border-border">
                ✓ Thank you for subscribing to the Aventura Gazette.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mt-1">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="h-10 text-xs bg-background border-border rounded-sm"
                />
                <Button variant="editorial" size="default" type="submit" className="shrink-0">
                  <span>Join Edit</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Column 1 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/40 inline-block w-fit">
              Boutiques & Services
            </h4>
            <ul className="flex flex-col gap-2.5">
              {BOUTIQUE_SERVICES.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground text-xs text-muted-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/40 inline-block w-fit">
              Customer Care
            </h4>
            <ul className="flex flex-col gap-2.5">
              {CUSTOMER_CARE.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground text-xs text-muted-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/40 inline-block w-fit">
              Maison Portal
            </h4>
            <ul className="flex flex-col gap-2.5">
              {MAISON_PARTNERS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground text-xs text-muted-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Secure Settlement */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground pb-2 border-b border-border/40 inline-block w-fit">
              Concierge Location
            </h4>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <span>19501 Biscayne Blvd</span>
              <span>Aventura, FL 33180</span>
              <Link href="mailto:concierge@aventuramall.com" className="hover:text-foreground transition-colors mt-1 font-medium text-foreground">
                concierge@aventuramall.com
              </Link>
            </div>
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                Certified Settlement
              </span>
              <div className="grid grid-cols-3 gap-1.5 max-w-[200px]">
                {PAYMENT_LOGOS.map((src, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border/60 rounded p-1 flex items-center justify-center h-7 shadow-xs"
                  >
                    <Image
                      src={src}
                      alt="Payment Method"
                      width={50}
                      height={20}
                      className="max-w-full max-h-full object-contain filter grayscale opacity-80"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Aventura Mall Miami. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/return-policy" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/support-policy" className="hover:text-foreground transition-colors">
              Concierge
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

