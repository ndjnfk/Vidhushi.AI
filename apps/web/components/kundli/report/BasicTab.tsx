"use client";

import type { KundliOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { lagnaLord, planetsByName } from "@/lib/kundliAnalysis";
import { NAKSHATRA_NAMES } from "@/lib/kundliReading";
import { rashiIndex } from "@/lib/rashi";
import { CARD, Facts, SubHeading, TabHeading, useReportText } from "./ui";

export default function BasicTab({ kundli }: { kundli: KundliOut }) {
  const { t } = useLanguage();
  const { R, P, planet, sign, date } = useReportText();
  const B = P.basic;
  const moon = planetsByName(kundli).Moon;
  const nak = moon ? NAKSHATRA_NAMES.indexOf(moon.nakshatra) : -1;
  const value = (v: string) => B.values[v] ?? v;
  const lucky = P.lucky[lagnaLord(kundli)];
  const pc = kundli.panchang;
  const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const av = kundli.avakhada;

  return (
    <div>
      <TabHeading title={P.tabs.basic} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={CARD}>
          <SubHeading>{B.birth}</SubHeading>
          <Facts rows={[
            [B.name, kundli.name],
            [B.date, date(`${kundli.birth_date}T00:00:00`)],
            [B.time, kundli.birth_time.slice(0, 5)],
            [B.place, kundli.place_name],
            [B.timezone, kundli.timezone],
          ]} />
        </section>

        <section className={CARD}>
          <SubHeading>{B.astro}</SubHeading>
          <Facts rows={[
            [B.lagna, sign(rashiIndex(kundli.d1_chart.ascendant_sign))],
            [B.rashi, moon ? sign(rashiIndex(moon.sign)) : "—"],
            [B.rashiLord, planet(av.moon_sign_lord)],
            [B.nakshatra, nak >= 0 ? `${R.nakshatras[nak]} · ${B.pada} ${moon!.pada}` : "—"],
            [B.nakshatraLord, moon ? planet(moon.nakshatra_lord) : "—"],
            [B.sunSign, sign(rashiIndex(av.sun_sign))],
          ]} />
        </section>

        <section className={CARD}>
          <SubHeading>{B.avakhada}</SubHeading>
          <p className="-mt-3 mb-4 text-sm text-cream/55">{B.avakhadaHint}</p>
          <Facts rows={[
            [B.varna, value(av.varna)],
            [B.vashya, value(av.vashya)],
            [B.yoni, value(av.yoni)],
            [B.gana, value(av.gana)],
            [B.nadi, value(av.nadi)],
            [B.tatva, value(av.tatva)],
          ]} />
        </section>

        <section className={CARD}>
          <SubHeading>{B.panchang}</SubHeading>
          <p className="-mt-3 mb-4 text-sm text-cream/55">{B.panchangHint}</p>
          <Facts rows={[
            [t("panchang.vara"), pc.vara],
            [t("panchang.tithi"), `${pc.tithi} (${pc.tithi_paksha} Paksha)`],
            [t("panchang.nakshatra"), pc.nakshatra],
            [t("panchang.yoga"), pc.yoga],
            [t("panchang.karana"), pc.karana],
            [t("panchang.sunrise"), time(pc.sunrise_utc)],
            [t("panchang.sunset"), time(pc.sunset_utc)],
          ]} />
        </section>

        {lucky && (
          <section className={`${CARD} lg:col-span-2`}>
            <SubHeading>{B.lucky}</SubHeading>
            <p className="-mt-3 mb-5 text-sm text-cream/55">{B.luckyHint} ({planet(lagnaLord(kundli))})</p>
            <dl className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {([[B.day, lucky.day], [B.color, lucky.color], [B.number, lucky.number], [B.gem, lucky.gem]] as const).map(([k, v]) => (
                <div key={k} className="bg-ink px-5 py-4">
                  <dt className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-cream/60">{k}</dt>
                  <dd className="mt-2 font-display text-xl text-gold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
