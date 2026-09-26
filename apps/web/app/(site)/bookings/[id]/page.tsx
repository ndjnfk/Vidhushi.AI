"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import PhotoGallery from "@/components/booking/PhotoGallery";
import ReviewForm from "@/components/reviews/ReviewForm";
import StatusBadge from "@/components/booking/StatusBadge";
import UpiPayModal from "@/components/booking/UpiPayModal";
import Starfield from "@/components/Starfield";
import { isLoggedIn } from "@/lib/auth";
import {
  cancelBooking, formatDob, formatSlot, getBooking, parseUtc, type ConsultationRequestOut,
} from "@/lib/bookings";
import { formatPrice } from "@/lib/shop";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useLive } from "@/lib/live";

const OPENS_EARLY_MS = 15 * 60 * 1000;
const PRIMARY =
  "inline-flex items-center justify-center gap-3 bg-white px-8 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60";
const SECONDARY =
  "inline-flex items-center justify-center gap-3 border border-cream/40 px-8 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors hover:border-gold hover:text-gold";

function Countdown({ to }: { to: Date }) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const ms = to.getTime() - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000), h = Math.floor((ms % 86_400_000) / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return <span>{t("booking.startsIn")} {d > 0 ? `${d}d ` : ""}{h}h {m}m</span>;
}

export default function BookingPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [b, setB] = useState<ConsultationRequestOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const closePay = useCallback(() => setPayOpen(false), []);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    getBooking(params.id).then(setB).catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = `/account/login?next=${encodeURIComponent(`/bookings/${params.id}`)}`;
      return;
    }
    load();
    // Pick up Vidushi Ji's decision without a manual refresh.
    const id = setInterval(() => {
      setNow(Date.now());
      load();
    }, 20_000);
    return () => clearInterval(id);
  }, [load, params.id]);
  // Approval, payment confirmation etc. appear the moment the admin acts.
  useLive("me", load);

  async function cancel() {
    if (!confirm(t("booking.cancelConfirm"))) return;
    setB(await cancelBooking(params.id));
  }

  const start = b?.scheduled_at ? parseUtc(b.scheduled_at) : null;
  const canJoin = !!start && now >= start.getTime() - OPENS_EARLY_MS;
  // Only what the booked session includes (set per session in the admin panel).
  const calls = (["video", "audio"] as const).filter((m) => b?.channels.includes(m));

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={73} />
      <Planet className="pointer-events-none absolute -right-[8%] -top-[12%] w-[min(34vw,440px)] opacity-80" />

      <div className="relative mx-auto max-w-3xl px-6 py-20">
        <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <Link href="/bookings" className="hover:text-gold">{t("nav.myBookings")}</Link>
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
          {t(b?.kind === "ritual" ? "booking.ritualPageTitle" : "booking.pageTitle")}
        </h1>

        {!b ? (
          <p className="mt-12 text-cream/70">{error ?? t("common.loading")}</p>
        ) : (
          <section className="mt-10 border border-line bg-ink/85 p-7 backdrop-blur-sm md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 font-display text-xl text-gold">VJ</div>
                <div>
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{t("booking.consultant")}</p>
                  <p className="font-display text-2xl uppercase tracking-[0.04em] text-gold">Vidushi Ji</p>
                </div>
              </div>
              <StatusBadge status={b.status} />
            </div>

            {/* Status message */}
            <p className="mt-8 leading-relaxed text-cream/85">{t(`booking.statusBody.${b.status}`)}</p>
            {b.admin_note && (
              <p className="mt-4 border-l-2 border-gold/60 pl-4 italic text-cream/80">&ldquo;{b.admin_note}&rdquo;</p>
            )}

            {/* Schedule */}
            {["approved", "payment_submitted", "confirmed", "completed"].includes(b.status) && (
              <dl className={`mt-8 grid gap-px border border-line bg-line ${b.kind === "ritual" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                {[
                  [b.kind === "ritual" ? "booking.ritualDate" : "booking.when", formatSlot(b.scheduled_at)],
                  ...(b.kind === "ritual" ? [] : [["booking.duration", b.duration_minutes ? `${b.duration_minutes} ${t("booking.minutes")}` : "—"]]),
                  ["booking.fee", b.amount != null ? formatPrice(b.amount) : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-ink px-5 py-4">
                    <dt className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{t(k)}</dt>
                    <dd className="mt-1.5 text-cream">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {b.fee_items.length > 0 && ["approved", "payment_submitted", "confirmed", "completed"].includes(b.status) && (
              <div className="border-x border-b border-line px-5 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{t("fee.breakUp")}</p>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {b.fee_items.map((f, i) => (
                    <li key={i} className="flex justify-between gap-4 text-cream/85">
                      <span>{f.label}</span>
                      <span>{formatPrice(f.amount)}</span>
                    </li>
                  ))}
                  <li className="mt-1 flex justify-between gap-4 border-t border-line pt-2 font-bold text-gold">
                    <span>{t("fee.total")}</span>
                    <span>{b.amount != null ? formatPrice(b.amount) : "—"}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Actions */}
            {(b.status === "approved" || b.status === "payment_submitted") && (
              <div className="mt-8">
                {b.status === "payment_submitted" && (
                  <p className="mb-5 border border-gold/40 bg-gold/10 px-5 py-4 text-sm leading-relaxed text-cream/90">
                    {t("pay.submittedNote")}
                    {b.payment_reference && <span className="mt-1 block text-cream/65">{t("pay.reference")}: {b.payment_reference}</span>}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <button type="button" onClick={() => setPayOpen(true)} className={b.status === "approved" ? PRIMARY : SECONDARY}>
                    <Sparkle className={`h-3.5 w-3.5 ${b.status === "approved" ? "text-gold-deep" : "text-gold"}`} />
                    {t(b.status === "approved" ? "booking.payNow" : "pay.showQrAgain")}
                  </button>
                  <Link href={`/bookings/${b.id}/chat`} className={SECONDARY}>
                    <Sparkle className="h-3.5 w-3.5 text-gold" />
                    {t("chat.open")}
                  </Link>
                </div>
                {(b.channels.includes("audio") || b.channels.includes("video")) && (
                  <p className="mt-3 text-xs text-cream/55">{t("pay.callsUnlockNote")}</p>
                )}
              </div>
            )}

            {b.status === "confirmed" && (
              <div className="mt-8">
                {calls.length > 0 && (
                  <p className="text-sm text-cream/70">
                    {canJoin ? t("booking.roomOpen") : <>{start && <Countdown to={start} />} · {t("booking.roomOpensNote")}</>}
                  </p>
                )}
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {calls.map((m) =>
                    canJoin ? (
                      <Link key={m} href={`/bookings/${b.id}/call?mode=${m}`} className={m === "video" ? PRIMARY : SECONDARY}>
                        <Sparkle className={`h-3.5 w-3.5 ${m === "video" ? "text-gold-deep" : "text-gold"}`} />
                        {t(m === "video" ? "booking.joinVideo" : "booking.joinAudio")}
                      </Link>
                    ) : (
                      <span key={m} aria-disabled="true" className={`${SECONDARY} cursor-not-allowed opacity-45`}>
                        {t(m === "video" ? "booking.joinVideo" : "booking.joinAudio")}
                      </span>
                    ),
                  )}
                  {b.channels.includes("chat") && (
                    <Link href={`/bookings/${b.id}/chat`} className={SECONDARY}>
                      <Sparkle className="h-3.5 w-3.5 text-gold" />
                      {t("chat.open")}
                    </Link>
                  )}
                </div>
                {b.channels.includes("chat") && <p className="mt-3 text-xs text-cream/55">{t("chat.anytimeNote")}</p>}
              </div>
            )}

            {b.status === "completed" && <ReviewForm target="booking" id={b.id} />}

            {b.status === "completed" && b.channels.includes("chat") && (
              <Link href={`/bookings/${b.id}/chat`} className={`${SECONDARY} mt-8`}>
                <Sparkle className="h-3.5 w-3.5 text-gold" />
                {t("chat.history")}
              </Link>
            )}

            {["pending", "approved", "payment_submitted"].includes(b.status) && (
              <button type="button" onClick={cancel} className="mt-6 text-sm text-cream/55 underline-offset-4 hover:text-gold hover:underline">
                {t("booking.cancel")}
              </button>
            )}
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            {payOpen && (
              <UpiPayModal
                id={b.id}
                onClose={closePay}
                onSubmitted={() => {
                  load();
                  setPayOpen(false);
                }}
              />
            )}

            {/* Request details */}
            <details className="mt-10 border-t border-line pt-6">
              <summary className="cursor-pointer text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70">{t("booking.yourDetails")}</summary>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["booking.name", b.name], ["booking.email", b.email], ["booking.phone", b.phone], ["booking.place", b.place],
                  ...(b.dob ? [["booking.dob", formatDob(b.dob)]] : []),
                  ["booking.topic", t(`booking.topic.${b.topic}`)], ["booking.message", b.message || "—"],
                ].map(([k, v]) => (
                  <div key={k} className={k === "booking.message" ? "sm:col-span-2" : undefined}>
                    <dt className="text-cream/55">{t(k)}</dt>
                    <dd className="whitespace-pre-wrap text-cream">{v}</dd>
                  </div>
                ))}
              </dl>
              {b.photo_count > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-sm text-cream/55">{t("booking.photosLabel")}</p>
                  <PhotoGallery id={b.id} viewer="client" name={b.name} />
                </div>
              )}
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
