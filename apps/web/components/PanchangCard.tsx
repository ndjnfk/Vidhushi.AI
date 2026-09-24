"use client";

import type { PanchangOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function PanchangCard({ panchang }: { panchang: PanchangOut }) {
  const { t } = useLanguage();
  const rows: [string, string][] = [
    ["panchang.vara", panchang.vara],
    ["panchang.tithi", `${panchang.tithi} (${panchang.tithi_paksha} Paksha)`],
    ["panchang.nakshatra", panchang.nakshatra],
    ["panchang.yoga", panchang.yoga],
    ["panchang.karana", panchang.karana],
    ["panchang.sunrise", fmtTime(panchang.sunrise_utc)],
    ["panchang.sunset", fmtTime(panchang.sunset_utc)],
  ];

  return (
    <section className="h-fit border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-8">
      <h2 className="font-display text-2xl uppercase tracking-[0.05em] text-gold">{t("kundli.panchang")}</h2>
      <dl className="mt-6 divide-y divide-line">
        {rows.map(([key, value]) => (
          <div key={key} className="flex items-baseline justify-between gap-6 py-3.5">
            <dt className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/65">{t(key)}</dt>
            <dd className="text-right text-cream">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
