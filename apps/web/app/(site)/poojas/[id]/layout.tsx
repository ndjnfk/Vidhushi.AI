import type { Metadata } from "next";
import type { PoojaServiceOut } from "@/lib/poojas";
import { JsonLd, SITE_NAME, SITE_URL, fetchPublic, pageMetadata, snippet } from "@/lib/seo";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

const getPooja = (id: string) => fetchPublic<PoojaServiceOut>(`/poojas/${encodeURIComponent(id)}`);

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const p = await getPooja(id);
  if (!p) return { title: "Pooja" };
  return pageMetadata(p.name, snippet(p.description), `/poojas/${p.id}`);
}

export default async function PoojaLayout({ children, params }: Props) {
  const { id } = await params;
  const p = await getPooja(id);
  return (
    <>
      {p && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: p.name,
            description: snippet(p.description, 300),
            url: `${SITE_URL}/poojas/${p.id}`,
            provider: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
            offers: { "@type": "Offer", priceCurrency: "INR", price: p.price },
          }}
        />
      )}
      {children}
    </>
  );
}
