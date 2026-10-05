import type { Metadata } from "next";
import { Great_Vibes, Italiana, Marcellus, Mulish } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CartProvider } from "@/lib/CartContext";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const italiana = Italiana({ variable: "--font-italiana", subsets: ["latin"], weight: "400" });
// "latin-ext" holds the ₹ sign, which prices use on most pages; listing it
// here preloads it instead of discovering it late from the CSS.
const marcellus = Marcellus({ variable: "--font-marcellus", subsets: ["latin", "latin-ext"], weight: "400" });
const mulish = Mulish({ variable: "--font-mulish", subsets: ["latin", "latin-ext"] });
const greatVibes = Great_Vibes({ variable: "--font-great-vibes", subsets: ["latin"], weight: "400" });

// Defaults only; each route sets its own title, description and canonical
// (see lib/seo.tsx). No canonical here, or every page would inherit "/".
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Online Tarot Reading & Healing`, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${italiana.variable} ${marcellus.variable} ${mulish.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <CartProvider>{children}</CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
