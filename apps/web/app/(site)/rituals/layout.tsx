import OnlyOnPath from "@/components/OnlyOnPath";
import ServiceInfo from "@/components/ServiceInfo";
import { RITUALS } from "@/lib/serviceContent";
import { JsonLd, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Healing Rituals & Candle Spells",
  "Healing rituals by Vidushi Ji — urgent wish and weekly candle rituals for love, career, health, finance and legal matters. Enquire or start online.",
  "/rituals",
);

const service = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Healing Rituals & Candle Spells",
  serviceType: "Spiritual healing ritual",
  description: "Healing rituals by Vidushi Ji — urgent wish and weekly candle rituals for love, career, health, finance and legal matters. Enquire or start online.",
  url: `${SITE_URL}/rituals`,
  areaServed: "IN",
  provider: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={service} />
      {children}
      <OnlyOnPath path="/rituals">
        <ServiceInfo content={RITUALS} />
      </OnlyOnPath>
    </>
  );
}
