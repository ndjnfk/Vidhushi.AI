import type { Metadata } from "next";
import type { RitualServiceOut } from "@/lib/rituals";
import { JsonLd, SITE_NAME, SITE_URL, fetchPublic, pageMetadata, snippet } from "@/lib/seo";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

const getRitual = (id: string) => fetchPublic<RitualServiceOut>(`/rituals/${encodeURIComponent(id)}`);

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const r = await getRitual(id);
  if (!r) return { title: "Healing Ritual" };
  return pageMetadata(r.name, snippet(r.description), `/rituals/${r.id}`);
}

export default async function RitualLayout({ children, params }: Props) {
  const { id } = await params;
  const r = await getRitual(id);
  return (
    <>
      {r && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: r.name,
            description: snippet(r.description, 300),
            url: `${SITE_URL}/rituals/${r.id}`,
            provider: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
            offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: r.price_min, highPrice: r.price_max },
          }}
        />
      )}
      {children}
    </>
  );
}
