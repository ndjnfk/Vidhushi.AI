import KundliView from "@/components/kundli/KundliView";
import { getKundli } from "@/lib/api";

export default async function KundliResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kundli = await getKundli(id);

  return <KundliView kundli={kundli} />;
}
