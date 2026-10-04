import OnlyOnPath from "@/components/OnlyOnPath";
import ServiceInfo from "@/components/ServiceInfo";
import { REVIEWS } from "@/lib/serviceContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Client Reviews & Testimonials",
  "Read what clients say about Vidushi Ji's astrology consultations, tarot readings, healing rituals and orders.",
  "/reviews",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnlyOnPath path="/reviews">
        <ServiceInfo content={REVIEWS} />
      </OnlyOnPath>
    </>
  );
}
