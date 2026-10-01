import OnlyOnPath from "@/components/OnlyOnPath";
import ServiceInfo from "@/components/ServiceInfo";
import { PRICING } from "@/lib/serviceContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Services & Pricing",
  "Charges for every Vidushi Ji service — astrology consultations, tarot sessions, healing rituals and candle spells. Tap any service to book.",
  "/pricing",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnlyOnPath path="/pricing">
        <ServiceInfo content={PRICING} />
      </OnlyOnPath>
    </>
  );
}
