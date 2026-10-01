import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "About Us — Vedic Astrologer & Tarot Reader",
  "Meet Vidushi Ji — Vedic astrologer and tarot reader. Our story, values and the astrology, tarot and healing services we offer.",
  "/about",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
