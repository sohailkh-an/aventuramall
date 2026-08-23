import type { Metadata } from "next";
import { Outfit, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aventura Mall | Luxury Redefined",
  description: "The Premier Shopping Destination — Fashion, Dining, Arts & Culture",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/logo.svg"],
    apple: ["/logo.svg"],
  },
};

import { CompareProvider } from "@/hooks/use-compare";
import { CartProvider } from "@/hooks/use-cart";
import { CurrencyProvider } from "@/hooks/use-currency";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { AuthProvider } from "@/lib/auth-client";
import { SellerAuthProvider } from "@/lib/seller-auth-client";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${playfair.variable} h-full antialiased`}
      data-theme="atelier-warm"
      suppressHydrationWarning
    >
      <head>
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-200">
        <QueryProvider>
          <AuthProvider>
            <SellerAuthProvider>
              <CurrencyProvider>
                <WishlistProvider>
                  <CompareProvider>
                    <CartProvider>
                      {children}
                      <Toaster position="bottom-right" />
                    </CartProvider>
                  </CompareProvider>
                </WishlistProvider>
              </CurrencyProvider>
            </SellerAuthProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

