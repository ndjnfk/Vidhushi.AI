"use client";

import Link from "next/link";
import { useState } from "react";
import Planet from "@/components/Planet";
import SocialIcons from "@/components/SocialIcons";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { sendContactMessage } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CONTACT_ICONS } from "@/lib/site";
import { telHref, useSiteInfo } from "@/lib/useSiteInfo";

const INPUT =
  "w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/75";

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5 border-b border-line py-6 last:border-b-0">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-gold/50 text-gold">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d={icon} />
        </svg>
      </span>
      <div>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{label}</p>
        <div className="mt-1.5 text-lg text-cream">{children}</div>
      </div>
    </li>
  );
}

export default function ContactPage() {
  const { t } = useLanguage();
  const site = useSiteInfo();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendContactMessage(form);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="-mx-6 -my-8 overflow-x-clip bg-ink font-body text-cream">
      {/* Banner */}
      <section className="relative flex min-h-[320px] items-center justify-center overflow-hidden border-b border-line px-6 py-24 text-center">
        <Starfield seed={107} />
        <Planet className="pointer-events-none absolute -right-[5%] top-[15%] w-[min(28vw,360px)]" />
        <div className="relative">
          <p className="flex items-center justify-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
            <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span className="text-gold">{t("nav.contact")}</span>
          </p>
          <h1 className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-none tracking-[0.04em] text-gold">{t("contact.title")}</h1>
          <p className="mx-auto mt-6 max-w-xl text-[1.1rem] leading-relaxed text-cream/85">{t("contact.subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1300px] gap-14 px-6 py-20 md:px-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        {/* Details */}
        <div>
          <h2 className="font-display text-3xl uppercase tracking-[0.04em] text-gold">{t("contact.getInTouch")}</h2>
          <ul className="mt-6">
            {site.phone && (
              <Row icon={CONTACT_ICONS.phone} label={t("contact.phone")}>
                <a href={telHref(site.phone)} className="hover:text-gold">{site.phone}</a>
              </Row>
            )}
            {site.whatsapp && (
              <Row icon={CONTACT_ICONS.chat} label="WhatsApp">
                <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                  {t("contact.whatsappCta")}
                </a>
              </Row>
            )}
            {site.email && (
              <Row icon={CONTACT_ICONS.mail} label={t("contact.email")}>
                <a href={`mailto:${site.email}`} className="break-all hover:text-gold">{site.email}</a>
              </Row>
            )}
            {site.address && <Row icon={CONTACT_ICONS.pin} label={t("contact.address")}>{site.address}</Row>}
            {site.hours && <Row icon={CONTACT_ICONS.clock} label={t("contact.hours")}>{site.hours}</Row>}
          </ul>
          <SocialIcons links={site.social_links} className="mt-6" />
          <div className="mt-8 border border-gold/40 bg-gold/10 p-6">
            <p className="text-cream/85">{t("contact.consultNote")}</p>
            <Link href="/?book=1" className="mt-4 inline-flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-gold hover:underline">
              <Sparkle className="h-3 w-3" />
              {t("home.ctaBook")}
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="border border-line bg-ink-soft/60 p-7 md:p-10">
          {sent ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Sparkle className="h-10 w-10 text-gold" />
              <h2 className="mt-6 font-display text-3xl uppercase tracking-[0.05em] text-gold">{t("contact.sentTitle")}</h2>
              <p className="mt-4 max-w-sm text-cream/80">{t("contact.sentBody")}</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl uppercase tracking-[0.04em] text-gold">{t("contact.formTitle")}</h2>
              <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className={LABEL}>{t("booking.name")}</span>
                  <input className={INPUT} value={form.name} onChange={set("name")} required maxLength={120} autoComplete="name" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className={LABEL}>{t("booking.email")}</span>
                  <input type="email" className={INPUT} value={form.email} onChange={set("email")} required autoComplete="email" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className={LABEL}>{t("contact.phoneOptional")}</span>
                  <input type="tel" className={INPUT} value={form.phone} onChange={set("phone")} maxLength={20} autoComplete="tel" />
                </label>
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className={LABEL}>{t("contact.message")}</span>
                  <textarea className={`${INPUT} min-h-40 resize-y`} value={form.message} onChange={set("message")} required maxLength={4000} />
                </label>
                {/* Honeypot for bots: hidden from people and screen readers */}
                <input type="text" name="website" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off"
                  aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
                <button type="submit" disabled={busy}
                  className="flex items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60 sm:col-span-2">
                  <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                  {busy ? t("booking.sending") : t("contact.send")}
                </button>
                {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
