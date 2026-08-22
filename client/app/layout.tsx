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
  description: "The Premier Luxury Shopping Destination — Fashion, Dining, Arts & Culture",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon.ico?v=2", type: "image/x-icon" },
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: ["/favicon.ico?v=2"],
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
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('am_theme_preset') || 'aventura-editorial';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
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
                      <ThemeSwitcher />
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

