import { getKundli } from "@/lib/api";
import NorthIndianChart from "@/components/chart/NorthIndianChart";
import SouthIndianChart from "@/components/chart/SouthIndianChart";
import DashaTimeline from "@/components/DashaTimeline";
import PanchangCard from "@/components/PanchangCard";

export default async function KundliResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kundli = await getKundli(id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{kundli.name}&apos;s Kundli</h1>
        <p className="text-gray-600">
          {kundli.birth_date} at {kundli.birth_time} &middot; {kundli.place_name} ({kundli.timezone})
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <NorthIndianChart chart={kundli.d1_chart} title="Rashi Chart (D1) — North Indian" />
        <SouthIndianChart chart={kundli.d1_chart} title="Rashi Chart (D1) — South Indian" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <NorthIndianChart chart={kundli.d9_chart} title="Navamsa Chart (D9) — North Indian" />
        <SouthIndianChart chart={kundli.d9_chart} title="Navamsa Chart (D9) — South Indian" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <PanchangCard panchang={kundli.panchang} />
        <DashaTimeline dasha={kundli.dasha} />
      </div>
    </div>
  );
}
