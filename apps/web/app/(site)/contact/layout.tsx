import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Contact Us — Book a Consultation",
  "Questions about a consultation, ritual or order? Contact Vidushi Ji by phone, WhatsApp, email or the message form.",
  "/contact",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
