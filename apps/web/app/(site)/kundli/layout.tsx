import { JsonLd, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Free Kundli Online — Birth Chart & Dasha",
  "Generate your free Vedic Kundli online: Lahiri sidereal birth chart, planet positions, nakshatras, Vimshottari Dasha timeline, Panchang and Manglik check.",
  "/kundli",
);

const service = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Free Kundli Online — Birth Chart & Dasha",
  serviceType: "Vedic birth chart (Kundli)",
  description: "Generate your free Vedic Kundli online: Lahiri sidereal birth chart, planet positions, nakshatras, Vimshottari Dasha timeline, Panchang and Manglik check.",
  url: `${SITE_URL}/kundli`,
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
