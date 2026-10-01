import { JsonLd, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Kundli Matching — Guna Milan Score out of 36",
  "Free Kundli matching for marriage: Ashtakoot Guna Milan score out of 36 from the bride's and groom's birth details, with each koota explained.",
  "/matching",
);

const service = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Kundli Matching — Guna Milan Score out of 36",
  serviceType: "Kundli matching (Guna Milan)",
  description: "Free Kundli matching for marriage: Ashtakoot Guna Milan score out of 36 from the bride's and groom's birth details, with each koota explained.",
  url: `${SITE_URL}/matching`,
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
