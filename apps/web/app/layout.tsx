import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CartProvider } from "@/lib/CartContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vidushiji.ai — Vedic Astrology",
  description: "Free Kundli, Panchang, Dasha and Guna Milan matching.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <CartProvider>
            <SiteHeader />
            <main className="flex-1 px-6 py-8">{children}</main>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
