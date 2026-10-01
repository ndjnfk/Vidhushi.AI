import type { Metadata } from "next";
import type { AstrologerOut } from "@/lib/astrologers";
import { JsonLd, SITE_URL, fetchPublic, pageMetadata, snippet } from "@/lib/seo";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

const getAstrologer = (id: string) => fetchPublic<AstrologerOut>(`/astrologers/${encodeURIComponent(id)}`);

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const a = await getAstrologer(id);
  if (!a) return { title: "Astrologer" };
  return pageMetadata(`${a.name} — Astrologer`, snippet(a.bio || `${a.name}: ${a.specialties.join(", ")}`), `/astrologers/${a.id}`);
}

export default async function AstrologerLayout({ children, params }: Props) {
  const { id } = await params;
  const a = await getAstrologer(id);
  return (
    <>
      {a && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: a.name,
            description: snippet(a.bio, 300),
            url: `${SITE_URL}/astrologers/${a.id}`,
            jobTitle: "Astrologer",
            knowsLanguage: a.languages,
            knowsAbout: a.specialties,
          }}
        />
      )}
      {children}
    </>
  );
}
