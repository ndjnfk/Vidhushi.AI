import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Book Online Poojas",
  "Book Vedic poojas performed on your behalf with your name, gotra and nakshatra. Choose a pooja, pick a date and pay online.",
  "/poojas",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
