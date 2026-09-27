"use client";

import { useState } from "react";
import type { KundliOut } from "@/lib/api";
import type { DoshaKey } from "@/lib/kundliReport";
import { rashiIndex } from "@/lib/rashi";
import { Badge, Bullets, CARD, EYEBROW, TabHeading, type Tone, useReportText } from "./ui";

const KEYS: DoshaKey[] = ["manglik", "kaalSarp", "sadeSati", "pitra"];

export default function DoshaTab({ kundli }: { kundli: KundliOut }) {
  const { R, P, planet, sign, date } = useReportText();
  const D = P.dosha;
  const d = kundli.doshas;
  const [open, setOpen] = useState<DoshaKey>("manglik");
  const [now] = useState(() => Date.now());

  const status: Record<DoshaKey, [Tone, string]> = {
    manglik: {
      none: ["good", D.absent], cancelled: ["good", D.cancelled], mild: ["mild", D.mild], strong: ["warn", D.present],
    }[d.manglik_severity] as [Tone, string],
    kaalSarp: d.kaal_sarp ? ["warn", D.present] : ["good", D.absent],
    sadeSati: d.sade_sati !== "none" ? ["warn", D.running] : d.dhaiya ? ["mild", D.running] : ["good", D.absent],
    pitra: d.pitra ? ["warn", D.present] : ["good", D.absent],
  };

  const M = D.manglik;
  const rahuHouse = kundli.d1_chart.planets.find((p) => p.planet === "Rahu")?.house ?? 1;

  const body: Record<DoshaKey, React.ReactNode> = {
    manglik: (
      <>
        <Section title={M.heading[d.manglik_severity]} tone={status.manglik[0]}>
          <p className="leading-relaxed text-cream/85">{M.analysis[d.manglik_severity]}</p>
        </Section>
        <Section title={M.byHouse}>
          <Bullets items={[
            M.fromLagna(d.manglik_from_lagna, R.ordinal(d.mars_house)),
            M.fromMoon(d.manglik_from_moon, R.ordinal(d.mars_house_from_moon)),
            M.fromVenus(d.manglik_from_venus),
          ]} />
        </Section>
        <Section title={M.byAspect}>
          <Bullets items={d.seventh_aspected_by.length ? d.seventh_aspected_by.map((p) => M.aspect(planet(p))) : [M.noAspect]} />
        </Section>
        {d.manglik_cancellations.length > 0 && (
          <Section title={M.cancelTitle} highlight>
            <Bullets items={d.manglik_cancellations.map((c) => M.cancel[c])} />
          </Section>
        )}
        <Meaning title={D.whatIsIt} text={M.meaning} />
      </>
    ),
    kaalSarp: (
      <>
        <Section title={D.titles.kaalSarp} tone={status.kaalSarp[0]}>
          <p className="leading-relaxed text-cream/85">{d.kaal_sarp ? D.kaalSarp.present(d.kaal_sarp_type) : D.kaalSarp.absent}</p>
          {d.kaal_sarp && <p className="mt-3 leading-relaxed text-cream/75">{D.kaalSarp.focus(R.ordinal(rahuHouse), R.houseArea[rahuHouse - 1])}</p>}
        </Section>
        <Meaning title={D.whatIsIt} text={D.kaalSarp.meaning} />
      </>
    ),
    sadeSati: (
      <>
        <Section title={D.titles.sadeSati} tone={status.sadeSati[0]}>
          <p className="leading-relaxed text-cream/85">{D.sadeSati.phase(d.sade_sati, sign(rashiIndex(d.saturn_transit_sign)))}</p>
          {d.dhaiya && <p className="mt-3 leading-relaxed text-amber-200/90">{D.sadeSati.dhaiya[d.dhaiya]}</p>}
        </Section>
        {d.sade_sati_periods.length > 0 && (
          <Section title={D.sadeSati.periods}>
            <ul className="divide-y divide-line border border-line">
              {d.sade_sati_periods.map((p) => {
                const when = Date.parse(p.end) < now ? "past" : Date.parse(p.start) <= now ? "now" : "next";
                return (
                  <li key={p.start} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${when === "now" ? "bg-gold/[0.08]" : ""}`}>
                    <span className={when === "past" ? "text-cream/50" : "text-cream"}>
                      {date(p.start)} — {date(p.end)}
                    </span>
                    <Badge tone={when === "now" ? "warn" : when === "next" ? "mild" : "ok"}>{D.sadeSati.when[when]}</Badge>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
        <Meaning title={D.whatIsIt} text={D.sadeSati.meaning} />
      </>
    ),
    pitra: (
      <>
        <Section title={D.titles.pitra} tone={status.pitra[0]}>
          <p className="leading-relaxed text-cream/85">{d.pitra ? D.pitra.present : D.pitra.absent}</p>
          {d.pitra && <div className="mt-4"><Bullets items={d.pitra_reasons.map((r) => D.pitra.reasons[r])} /></div>}
        </Section>
        <Meaning title={D.whatIsIt} text={D.pitra.meaning} />
      </>
    ),
  };

  return (
    <div>
      <TabHeading title={P.tabs.dosha} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KEYS.map((k) => (
          <button key={k} type="button" onClick={() => setOpen(k)} aria-pressed={open === k}
            className={`flex items-center justify-between gap-3 border px-5 py-4 text-left transition-colors ${
              open === k ? "border-gold bg-gold/10" : "border-line bg-ink-soft/50 hover:border-gold/60"
            }`}>
            <span className={open === k ? "text-gold" : "text-cream"}>{D.titles[k]}</span>
            <Badge tone={status[k][0]}>{status[k][1]}</Badge>
          </button>
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-6">
        {body[open]}
      </div>
    </div>
  );
}

function Section({ title, tone, highlight, children }: { title: string; tone?: Tone; highlight?: boolean; children: React.ReactNode }) {
  return (
    <section className={`${CARD} ${highlight ? "border-gold/40 bg-gold/[0.06]" : ""}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-gold">{title}</h3>
        {tone && <span className={`h-2.5 w-2.5 rounded-full ${tone === "good" ? "bg-gold" : tone === "warn" ? "bg-red-300" : "bg-amber-200"}`} aria-hidden="true" />}
      </div>
      {children}
    </section>
  );
}

function Meaning({ title, text }: { title: string; text: string }) {
  return (
    <section className="border-l-2 border-gold/50 pl-5">
      <p className={EYEBROW}>{title}</p>
      <p className="mt-2 leading-relaxed text-cream/75">{text}</p>
    </section>
  );
}
