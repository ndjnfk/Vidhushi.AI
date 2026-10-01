import { JsonLd, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Online Tarot Reading — Love & Career",
  "Book a personal tarot reading with Vidushi Ji for love, career, health and life guidance — or draw a free tarot card online, no account needed.",
  "/tarot",
);

const service = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Online Tarot Reading — Love & Career",
  serviceType: "Tarot reading",
  description: "Book a personal tarot reading with Vidushi Ji for love, career, health and life guidance — or draw a free tarot card online, no account needed.",
  url: `${SITE_URL}/tarot`,
  areaServed: "IN",
  provider: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={service} />
      {children}
    </>
  );
}
