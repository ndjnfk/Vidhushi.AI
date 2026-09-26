"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PhotoPicker from "@/components/booking/PhotoPicker";
import Sparkle from "@/components/Sparkle";
import { getMe } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { createBooking, type ConsultationRequestOut, type Topic } from "@/lib/bookings";
import en from "@/lib/i18n/dictionaries/en";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatInr, RITUAL_INTENTIONS, type RitualIntention } from "@/lib/offerings";
import { useTarotContent, type TarotSessionItem } from "@/lib/useTarotContent";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const TOPICS: Topic[] = ["love", "career", "marriage", "other"];
const INPUT =
  "w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold";
const SELECT = `${INPUT} bg-ink [color-scheme:dark]`;
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/75";
const OPEN_PARAM = "book";
// The API caps `message` at 2000; leave room for the session/ritual summary.
const NOTE_MAX = 1500;

// What the form is for. Tarot and ritual forms prepend a summary (session,
// DOB, preferred slot / intention, timeline) to the message the admin reads.
export type BookingPreset =
  | { kind: "general" }
  | { kind: "tarot"; session?: string }
  | { kind: "ritual"; intention?: RitualIntention };

const GENERAL: BookingPreset = { kind: "general" };

function presetKey(p: BookingPreset): string {
  if (p.kind === "tarot") return `tarot${p.session ? `:${p.session}` : ""}`;
  if (p.kind === "ritual") return `ritual${p.intention ? `:${p.intention}` : ""}`;
  return "1";
}

// Tarot and ritual forms don't ask for a topic; the API still needs one.
function sessionTopic(id: string): Topic {
  if (id === "area-love") return "love";
  if (id === "area-career") return "career";
  return "other";
}

function ritualTopic(i: RitualIntention): Topic {
  return i === "love" ? "love" : i === "career" ? "career" : "other";
}

function sessionLabel(s: TarotSessionItem, t: (k: string) => string): string {
  return `${s.name} — ${s.price === null ? t("tarot.priceOnRequest") : formatInr(s.price)}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function BookingModal({ preset, onClose }: { preset: BookingPreset; onClose: () => void }) {
  const { t } = useLanguage();
  // Sessions and modalities as edited in the admin panel (or the built-in ones).
  const { sessions, modalities } = useTarotContent();
  const initialSession = preset.kind === "tarot"
    ? (sessions.find((x) => x.id === preset.session) ?? sessions[0])?.id ?? ""
    : "";
  const initialIntention = preset.kind === "ritual" ? preset.intention ?? "other" : "other";
  const [form, setForm] = useState({
    name: "", email: "", phone: "", place: "",
    topic: (preset.kind === "ritual" ? ritualTopic(initialIntention) : preset.kind === "tarot" ? sessionTopic(initialSession) : "career") as Topic,
    message: "",
    session: initialSession, modality: modalities[0]?.name ?? "", dob: "", date: "", time: "",
    intention: initialIntention as RitualIntention, timeline: "",
  });
  const [photo, setPhoto] = useState<string | null>(null); // required for sessions and rituals
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ConsultationRequestOut | null>(null);
  useLockBodyScroll(true);

  useEffect(() => {
    getMe()
      .then((me) => setForm((f) => (f.email ? f : { ...f, email: me.email })))
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const session = sessions.find((x) => x.id === form.session);

  function composeMessage(): string {
    const note = form.message.trim();
    if (preset.kind === "tarot") {
      const lines = [
        `Tarot session: ${session ? sessionLabel(session, (k) => en[k] ?? k) : form.session}`,
        `Modality: ${form.modality || en["modality.any"]}`,
        `Preferred date & time: ${form.date} ${form.time}`.trim(),
      ];
      return `${lines.join("\n")}\n\n${note}`.trim();
    }
    if (preset.kind === "ritual") {
      const lines = [`Ritual enquiry: ${en[`rituals.intention.${form.intention}`]}`];
      if (form.timeline.trim()) lines.push(`Preferred timeline: ${form.timeline.trim()}`);
      return `${lines.join("\n")}\n\n${note}`.trim();
    }
    return note;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preset.kind !== "general" && !photo) {
      setError(t("booking.photoRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { name, email, phone, place, topic } = form;
      setDone(await createBooking({
        name, email, phone, place, topic, message: composeMessage(),
        ...(preset.kind === "tarot" && form.session ? { session_id: form.session } : {}),
        ...(preset.kind !== "general" ? { dob: form.dob } : {}),
        ...(preset.kind === "ritual" ? { kind: "ritual" as const } : {}),
        ...(photo ? { photos: [photo] } : {}),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request");
    } finally {
      setBusy(false);
    }
  }

  const title = preset.kind === "tarot" ? "booking.tarotTitle" : preset.kind === "ritual" ? "booking.ritualTitle" : "booking.title";
  const subtitle = preset.kind === "tarot" ? "booking.tarotSubtitle" : preset.kind === "ritual" ? "booking.ritualSubtitle" : "booking.subtitle";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 font-body text-cream sm:p-6">
      <button type="button" aria-label={t("nav.close")} onClick={onClose} className="fixed inset-0 bg-black/70" />
      {/* Header and submit bar stay put; only the fields scroll. */}
      <div role="dialog" aria-modal="true" aria-labelledby="book-title"
        className="relative flex max-h-full w-full max-w-[620px] flex-col border border-line bg-ink shadow-2xl">
        <button type="button" onClick={onClose} aria-label={t("nav.close")}
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-cream/35 text-gold hover:border-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>

        {done ? (
          <div className="no-scrollbar flex flex-col items-center overflow-y-auto px-7 py-12 text-center md:px-10">
            <Sparkle className="h-10 w-10 text-gold" />
            <h2 id="book-title" className="mt-6 font-display text-3xl uppercase tracking-[0.05em] text-gold">{t("booking.sentTitle")}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-cream/85">{t("booking.sentBody")}</p>
            <Link href={`/bookings/${done.id}`}
              className="mt-8 inline-flex items-center gap-3 bg-white px-8 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink hover:bg-gold">
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {t("booking.viewStatus")}
            </Link>
          </div>
        ) : (
          <>
            <header className="shrink-0 border-b border-line px-7 pb-6 pt-7 md:px-10 md:pt-9">
              <h2 id="book-title" className="pr-12 font-display text-3xl uppercase tracking-[0.05em] text-gold">{t(title)}</h2>
              <p className="mt-3 text-cream/75">{t(subtitle)}</p>
            </header>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="no-scrollbar grid min-h-0 flex-1 gap-5 overflow-y-auto overscroll-contain px-7 py-6 sm:grid-cols-2 md:px-10">
              {preset.kind === "tarot" && (
                <>
                  <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className={LABEL}>{t("booking.session")}</span>
                    <select className={SELECT} value={form.session} required
                      onChange={(e) => {
                        const session = e.target.value;
                        setForm((f) => ({ ...f, session, topic: sessionTopic(session) }));
                      }}>
                      {(["call", "reading", "area"] as const).map((g) => (
                        <optgroup key={g} label={t(g === "call" ? "tarot.groupCall" : g === "reading" ? "tarot.groupReading" : "tarot.areasTitle")}>
                          {sessions.filter((s) => s.group === g).map((s) => (
                            <option key={s.id} value={s.id}>{sessionLabel(s, t)}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={LABEL}>{t("booking.preferredDate")}</span>
                    <input type="date" className={`${INPUT} [color-scheme:dark]`} value={form.date} onChange={set("date")} required min={today()} />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={LABEL}>{t("booking.preferredTime")}</span>
                    <input type="time" className={`${INPUT} [color-scheme:dark]`} value={form.time} onChange={set("time")} required />
                  </label>
                </>
              )}
              {preset.kind === "ritual" && (
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className={LABEL}>{t("booking.intention")}</span>
                  <select className={SELECT} value={form.intention} required
                    onChange={(e) => {
                      const intention = e.target.value as RitualIntention;
                      setForm((f) => ({ ...f, intention, topic: ritualTopic(intention) }));
                    }}>
                    {RITUAL_INTENTIONS.map((i) => (
                      <option key={i} value={i}>{t(`rituals.intention.${i}`)}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className={LABEL}>{t("booking.name")}</span>
                <input className={INPUT} value={form.name} onChange={set("name")} required maxLength={120} autoComplete="name" />
              </label>
              <label className="flex flex-col gap-2">
                <span className={LABEL}>{t("booking.email")}</span>
                <input type="email" className={INPUT} value={form.email} onChange={set("email")} required autoComplete="email" />
              </label>
              <label className="flex flex-col gap-2">
                <span className={LABEL}>{t("booking.phone")}</span>
                <input type="tel" className={INPUT} value={form.phone} onChange={set("phone")} required minLength={6} maxLength={20}
                  pattern="[0-9+\-\s]{6,20}" autoComplete="tel" />
              </label>
              {preset.kind !== "general" && (
                <label className="flex flex-col gap-2">
                  <span className={LABEL}>{t("booking.dob")}</span>
                  <input type="date" className={`${INPUT} [color-scheme:dark]`} value={form.dob} onChange={set("dob")}
                    required min="1900-01-01" max={today()} />
                </label>
              )}
              <label className={`flex flex-col gap-2 ${preset.kind !== "general" ? "" : "sm:col-span-2"}`}>
                <span className={LABEL}>{t("booking.place")}</span>
                <input className={INPUT} value={form.place} onChange={set("place")} required maxLength={200}
                  placeholder={t("booking.placePlaceholder")} />
              </label>
              {preset.kind === "tarot" && (
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className={LABEL}>{t("booking.modality")}</span>
                  <select className={SELECT} value={form.modality} onChange={set("modality")}>
                    {modalities.map((m, i) => (
                      <option key={`${m.name}-${i}`} value={m.name}>{m.name}</option>
                    ))}
                    <option value="">{t("modality.any")}</option>
                  </select>
                </label>
              )}
              {preset.kind === "ritual" && (
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className={LABEL}>{t("booking.timeline")}</span>
                  <input className={INPUT} value={form.timeline} onChange={set("timeline")} maxLength={200}
                    placeholder={t("booking.timelinePlaceholder")} />
                </label>
              )}
              {preset.kind === "general" && (
                <fieldset className="flex flex-col gap-2 sm:col-span-2">
                  <legend className={`${LABEL} mb-2`}>{t("booking.topic")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((topic) => (
                      <button key={topic} type="button" aria-pressed={form.topic === topic}
                        onClick={() => setForm((f) => ({ ...f, topic }))}
                        className={`border px-4 py-2 text-sm transition-colors ${
                          form.topic === topic ? "border-gold bg-gold/15 text-gold" : "border-line text-cream/80 hover:border-cream/40"
                        }`}>
                        {t(`booking.topic.${topic}`)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className={LABEL}>
                  {t(preset.kind === "tarot" ? "booking.questions" : preset.kind === "ritual" ? "booking.ritualDetails" : "booking.message")}
                </span>
                <textarea className={`${INPUT} min-h-24 resize-none`} value={form.message} onChange={set("message")}
                  maxLength={preset.kind === "general" ? 2000 : NOTE_MAX} required={preset.kind !== "general"}
                  placeholder={t(preset.kind === "tarot" ? "booking.questionsPlaceholder" : preset.kind === "ritual" ? "booking.ritualDetailsPlaceholder" : "booking.messagePlaceholder")} />
              </label>
              {preset.kind !== "general" && (
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <span className={LABEL}>{t("booking.photos")}</span>
                  <p className="text-sm leading-relaxed text-cream/60">{t("booking.photosHint")}</p>
                  <PhotoPicker value={photo} onChange={(p) => { setPhoto(p); setError(null); }} />
                </div>
              )}
              </div>

              <footer className="shrink-0 border-t border-line px-7 py-5 md:px-10">
                {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60">
                  <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                  {busy ? t("booking.sending") : t(preset.kind === "ritual" ? "booking.submitEnquiry" : "booking.submit")}
                </button>
              </footer>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// "Book Consultation" button: sends logged-out visitors to log in first, then
// back here with ?book=<preset>, which re-opens the matching form automatically.
export default function BookConsultationButton({
  className,
  children,
  preset = GENERAL,
}: {
  className: string;
  children: React.ReactNode;
  preset?: BookingPreset;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const key = presetKey(preset);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(OPEN_PARAM) !== key) return;
    if (!isLoggedIn()) {
      window.location.href = `/account/login?next=${encodeURIComponent(`${url.pathname}?${OPEN_PARAM}=${key}`)}`;
      return;
    }
    // Strip the param only when actually opening, so a cancelled first
    // effect run (React dev double-invoke) doesn't lose it. Re-reading the URL
    // lets only the first button with this preset open when several match.
    const id = requestAnimationFrame(() => {
      const now = new URL(window.location.href);
      if (now.searchParams.get(OPEN_PARAM) !== key) return;
      now.searchParams.delete(OPEN_PARAM);
      window.history.replaceState(null, "", now.pathname + now.search + now.hash);
      setOpen(true);
    });
    return () => cancelAnimationFrame(id);
  }, [key]);

  function handleClick() {
    if (!isLoggedIn()) {
      const back = `${window.location.pathname}?${OPEN_PARAM}=${key}`;
      window.location.href = `/account/login?next=${encodeURIComponent(back)}`;
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {children}
      </button>
      {/* Portal: a backdrop-blur ancestor (e.g. a service card) would otherwise trap the fixed overlay. */}
      {open && createPortal(<BookingModal preset={preset} onClose={close} />, document.body)}
    </>
  );
}
