import OnlyOnPath from "@/components/OnlyOnPath";
import ServiceInfo from "@/components/ServiceInfo";
import { ABOUT } from "@/lib/serviceContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Vidushi Sharma — Tarot Reader & Healer in India",
  "Online tarot reading, energy healing and occult guidance by Vidushi Sharma since 2020. 5,000+ clients guided, 1,500+ students taught. Book your session today.",
  "/about",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnlyOnPath path="/about">
        <ServiceInfo content={ABOUT} />
      </OnlyOnPath>
    </>
  );
}
