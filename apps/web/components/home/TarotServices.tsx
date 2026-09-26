"use client";

import Link from "next/link";
import BookConsultationButton from "@/components/booking/BookConsultation";
import SectionHeading from "@/components/SectionHeading";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import OfferingIcon from "@/components/tarot/OfferingIcon";
import { formatInr } from "@/lib/offerings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTarotContent, type TarotSessionItem } from "@/lib/useTarotContent";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-3 bg-white px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold";
const OUTLINE_BTN =
  "inline-flex items-center justify-center gap-3 border border-cream/40 px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream transition-colors hover:border-gold hover:text-gold";
const EYEBROW = "text-[12px] font-extrabold uppercase tracking-[0.16em]";

const AREA_ICON: Record<string, string> = { "area-love": "love", "area-career": "career", "area-health": "health" };

function SessionCard({ session }: { session: TarotSessionItem }) {
  const { t } = useLanguage();
  const tag = session.tag || (session.group === "reading" ? t("tarot.groupReading") : "");
  return (
    <article className="group flex flex-col border border-line bg-ink-soft/80 p-7 backdrop-blur-sm transition-colors hover:border-gold/60">
      <div className="flex items-start justify-between gap-4">
        <span className={`${EYEBROW} text-cream/60`}>{tag}</span>
        <Sparkle className="h-3 w-3 text-gold/70 transition-transform duration-500 group-hover:rotate-90" />
      </div>
      <h3 className="mt-5 font-display text-[1.45rem] uppercase leading-tight tracking-[0.04em] text-gold">{session.name}</h3>
      <p className="mt-4 flex-1 leading-relaxed text-cream/75">{session.description}</p>
      <p className="mt-6 border-t border-line pt-5 font-display text-[2rem] leading-none text-cream">
        {session.price === null ? t("tarot.priceOnRequest") : formatInr(session.price)}
      </p>
      <BookConsultationButton preset={{ kind: "tarot", session: session.id }} className={`${OUTLINE_BTN} mt-6 w-full px-6 py-4`}>
        <Sparkle className="h-3 w-3 text-gold" />
        {t("tarot.bookThis")}
      </BookConsultationButton>
    </article>
  );
}

function SessionGroup({ title, sessions, first }: { title: string; sessions: TarotSessionItem[]; first: boolean }) {
  if (sessions.length === 0) return null;
  return (
    <>
      <h3 className={`${EYEBROW} ${first ? "" : "mt-16"} flex items-center gap-3 text-gold`}>
        <Sparkle className="h-3 w-3" />
        {title}
      </h3>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
      </div>
    </>
  );
}

// Home-page tarot offering below the hero: priced sessions, guidance areas,
// modalities and booking steps. Content comes from the admin panel
// ("Tarot sessions"), falling back to the built-in text.
export default function TarotServices() {
  const { t } = useLanguage();
  const c = useTarotContent();
  const calls = c.sessions.filter((s) => s.group === "call");
  const readings = c.sessions.filter((s) => s.group === "reading");
  const areas = c.sessions.filter((s) => s.group === "area");

  return (
    <>
      {/* Sessions */}
      {calls.length + readings.length > 0 && (
        <section id="sessions" className="scroll-mt-28 border-t border-line px-6 py-24 md:px-16">
          <SectionHeading title={c.sessions_title} subtitle={c.sessions_subtitle} />
          <div className="mx-auto mt-16 max-w-[1400px]">
            <SessionGroup title={t("tarot.groupCall")} sessions={calls} first />
            <SessionGroup title={t("tarot.groupReading")} sessions={readings} first={calls.length === 0} />
          </div>
        </section>
      )}

      {/* Guidance by area */}
      {areas.length > 0 && (
        <section className="relative overflow-hidden border-t border-line px-6 py-24 md:px-16">
          <Starfield seed={67} />
          <div className="relative">
            <SectionHeading title={c.areas_title} subtitle={c.areas_subtitle} />
            <div className="mx-auto mt-16 flex max-w-[1200px] flex-wrap justify-center gap-6">
              {areas.map((s) => (
                <article key={s.id} className="flex w-full flex-col items-center border border-line bg-ink/85 p-8 text-center backdrop-blur-sm md:w-[calc((100%-3rem)/3)]">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-gold/50 text-gold">
                    <OfferingIcon name={AREA_ICON[s.id] ?? "any"} className="h-9 w-9" />
                  </span>
                  <h3 className="mt-6 font-display text-[1.45rem] uppercase tracking-[0.04em] text-gold">{s.name}</h3>
                  <p className="mt-4 flex-1 leading-relaxed text-cream/75">{s.description}</p>
                  {s.price !== null && <p className="mt-5 font-display text-2xl text-cream">{formatInr(s.price)}</p>}
                  <BookConsultationButton preset={{ kind: "tarot", session: s.id }} className={`${OUTLINE_BTN} mt-8 px-8 py-4`}>
                    <Sparkle className="h-3 w-3 text-gold" />
                    {t("tarot.bookThis")}
                  </BookConsultationButton>
                </article>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm italic leading-relaxed text-cream/65">{c.areas_note}</p>
          </div>
        </section>
      )}

      {/* Modalities */}
      <section className="border-t border-line px-6 py-24 md:px-16">
        <SectionHeading title={c.modalities_title} subtitle={c.modalities_intro} />
        <ul className="mx-auto mt-16 flex max-w-[1200px] flex-wrap justify-center gap-4">
          {c.modalities.map((m, i) => (
            <li key={`${m.name}-${i}`}
              className="group flex w-[calc((100%-1rem)/2)] flex-col items-center gap-4 border border-line px-3 py-8 transition-colors hover:border-gold/60 sm:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-6rem)/7)]">
              <span className="font-display text-sm text-cream/40">{String(i + 1).padStart(2, "0")}</span>
              <OfferingIcon name={m.icon} className="h-10 w-10 text-gold transition-transform duration-500 group-hover:scale-110" />
              <span className="text-center text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream">{m.name}</span>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-10 max-w-3xl text-center leading-relaxed text-cream/75">{c.modalities_note}</p>
      </section>

      {/* How to book */}
      <section className="relative overflow-hidden border-t border-line px-6 py-24 md:px-16">
        <Starfield seed={71} />
        <div className="relative">
          <SectionHeading title={c.how_title} />
          <ol className="mx-auto mt-16 flex max-w-[1200px] flex-wrap justify-center gap-6">
            {c.steps.map((s, i) => (
              <li key={`${s.title}-${i}`} className="relative flex w-full flex-col border border-line bg-ink/85 p-8 backdrop-blur-sm lg:w-[calc((100%-3rem)/3)]">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-gold/60 font-display text-2xl text-gold">
                  {i + 1}
                </span>
                <h3 className="mt-6 font-display text-[1.35rem] uppercase leading-snug tracking-[0.04em] text-gold">{s.title}</h3>
                {s.body && <p className="mt-3 leading-relaxed text-cream/80">{s.body}</p>}
                {s.items.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {s.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-3 text-cream">
                        <Sparkle className="h-2.5 w-2.5 shrink-0 text-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {i === c.steps.length - 1 && c.how_note && (
                  <p className="mt-5 text-sm italic leading-relaxed text-cream/65">{c.how_note}</p>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <BookConsultationButton preset={{ kind: "tarot" }} className={PRIMARY_BTN}>
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {t("tarot.ctaBook")}
            </BookConsultationButton>
            <Link href="/tarot" className={OUTLINE_BTN}>
              <Sparkle className="h-3.5 w-3.5 text-gold" />
              {t("tarot.freeTitle")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
