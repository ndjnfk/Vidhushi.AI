import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Astrology Journal",
  "Articles on Vedic astrology basics, kundli, daily rituals, tarot and marriage compatibility from Vidushi Ji.",
  "/blog",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
