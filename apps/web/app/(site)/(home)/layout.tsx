import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

// The home page lives in this route group only so it can have its own
// metadata: the canonical "/" also folds duplicates like "/?book=1" into it.
export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Vedic Astrology, Kundli & Tarot Reading` },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: `${SITE_NAME} — Vedic Astrology, Kundli & Tarot Reading`, description: DEFAULT_DESCRIPTION, url: "/" },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
