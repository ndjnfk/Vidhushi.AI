import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Astrology Blog — Kundli, Matching & Remedies",
  "Articles on Vedic astrology basics, kundli, daily rituals, tarot and marriage compatibility from Vidushi Ji.",
  "/blog",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
