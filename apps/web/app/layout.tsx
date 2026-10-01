import type { Metadata } from "next";
import { Geist, Geist_Mono, Great_Vibes, Italiana, Marcellus, Mulish } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CartProvider } from "@/lib/CartContext";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const italiana = Italiana({ variable: "--font-italiana", subsets: ["latin"], weight: "400" });
const marcellus = Marcellus({ variable: "--font-marcellus", subsets: ["latin"], weight: "400" });
const mulish = Mulish({ variable: "--font-mulish", subsets: ["latin"] });
const greatVibes = Great_Vibes({ variable: "--font-great-vibes", subsets: ["latin"], weight: "400" });

// Defaults only; each route sets its own title, description and canonical
// (see lib/seo.tsx). No canonical here, or every page would inherit "/".
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Vedic Astrology & Tarot`, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${italiana.variable} ${marcellus.variable} ${mulish.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <CartProvider>{children}</CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
