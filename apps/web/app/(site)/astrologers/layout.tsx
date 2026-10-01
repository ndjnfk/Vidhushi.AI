import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Talk to an Astrologer",
  "Consult experienced Vedic astrologers by chat or call. See languages, specialties, experience and session rates, then book.",
  "/astrologers",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
