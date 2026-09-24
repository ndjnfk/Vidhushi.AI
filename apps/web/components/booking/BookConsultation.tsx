"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { getMe } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { createBooking, type ConsultationRequestOut, type Topic } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const TOPICS: Topic[] = ["love", "career", "marriage", "other"];
const INPUT =
  "w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/75";
const OPEN_PARAM = "book";

function BookingModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", phone: "", place: "", topic: "career" as Topic, message: "" });
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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setDone(await createBooking(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request");
    } finally {
      setBusy(false);
    }
  }

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
              <h2 id="book-title" className="pr-12 font-display text-3xl uppercase tracking-[0.05em] text-gold">{t("booking.title")}</h2>
              <p className="mt-3 text-cream/75">{t("booking.subtitle")}</p>
            </header>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="no-scrollbar grid min-h-0 flex-1 gap-5 overflow-y-auto overscroll-contain px-7 py-6 sm:grid-cols-2 md:px-10">
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
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className={LABEL}>{t("booking.place")}</span>
                <input className={INPUT} value={form.place} onChange={set("place")} required maxLength={200}
                  placeholder={t("booking.placePlaceholder")} />
              </label>
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
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className={LABEL}>{t("booking.message")}</span>
                <textarea className={`${INPUT} min-h-24 resize-none`} value={form.message} onChange={set("message")} maxLength={2000}
                  placeholder={t("booking.messagePlaceholder")} />
              </label>
              </div>

              <footer className="shrink-0 border-t border-line px-7 py-5 md:px-10">
                {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60">
                  <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                  {busy ? t("booking.sending") : t("booking.submit")}
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
// back here with ?book=1, which re-opens the form automatically.
export default function BookConsultationButton({ className, children }: { className: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(OPEN_PARAM) === "1" && !isLoggedIn()) {
      window.location.href = `/account/login?next=${encodeURIComponent(`${url.pathname}?${OPEN_PARAM}=1`)}`;
      return;
    }
    if (url.searchParams.get(OPEN_PARAM) === "1") {
      // Strip the param only when actually opening, so a cancelled first
      // effect run (React dev double-invoke) doesn't lose it.
      const id = requestAnimationFrame(() => {
        url.searchParams.delete(OPEN_PARAM);
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        setOpen(true);
      });
      return () => cancelAnimationFrame(id);
    }
  }, []);

  function handleClick() {
    if (!isLoggedIn()) {
      const back = `${window.location.pathname}?${OPEN_PARAM}=1`;
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
      {open && <BookingModal onClose={close} />}
    </>
  );
}
