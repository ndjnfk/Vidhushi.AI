import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Client Reviews & Testimonials",
  "Read what clients say about Vidushi Ji's astrology consultations, tarot readings, healing rituals and orders.",
  "/reviews",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
