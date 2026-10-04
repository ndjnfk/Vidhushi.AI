import OnlyOnPath from "@/components/OnlyOnPath";
import ServiceInfo from "@/components/ServiceInfo";
import { SHOP } from "@/lib/serviceContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Healing Bracelets & Gemstones Shop",
  "Shop healing bracelets, gemstones and sacred items — handpicked, energised and blessed by Vidushi Ji. Delivered across India.",
  "/shop",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnlyOnPath path="/shop">
        <ServiceInfo content={SHOP} />
      </OnlyOnPath>
    </>
  );
}
