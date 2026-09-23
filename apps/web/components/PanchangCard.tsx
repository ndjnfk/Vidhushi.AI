import type { PanchangOut } from "@/lib/api";

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function PanchangCard({ panchang }: { panchang: PanchangOut }) {
  const rows: [string, string][] = [
    ["Vara", panchang.vara],
    ["Tithi", `${panchang.tithi} (${panchang.tithi_paksha} Paksha)`],
    ["Nakshatra", panchang.nakshatra],
    ["Yoga", panchang.yoga],
    ["Karana", panchang.karana],
    ["Sunrise", fmtTime(panchang.sunrise_utc)],
    ["Sunset", fmtTime(panchang.sunset_utc)],
  ];

  return (
    <div className="border rounded p-4 flex flex-col gap-1 max-w-sm">
      <h3 className="font-semibold mb-2">Panchang</h3>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
