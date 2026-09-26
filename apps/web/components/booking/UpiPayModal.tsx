"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Sparkle from "@/components/Sparkle";
import { ApiError } from "@/lib/api";
import { getPaymentInfo, submitPayment, type UpiPaymentInfoOut } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice, getOrderPaymentInfo, submitOrderPayment } from "@/lib/shop";

// What is being paid for: a consultation/ritual fee, or a shop order's advance.
const TARGETS = {
  booking: { info: getPaymentInfo, submit: submitPayment, afterNote: "pay.afterNote" },
  order: { info: getOrderPaymentInfo, submit: submitOrderPayment, afterNote: "pay.afterNoteOrder" },
} as const;
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

// Pay by UPI: QR code (scan with any UPI app), the UPI ID to copy, an "open
// UPI app" link for phones, then "I have paid" with an optional transaction
// reference. Vidushi Ji confirms receipt separately.
export default function UpiPayModal({
  kind = "booking",
  id,
  onClose,
  onSubmitted,
}: {
  kind?: keyof typeof TARGETS;
  id: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const target = TARGETS[kind];
  const { t } = useLanguage();
  const [info, setInfo] = useState<UpiPaymentInfoOut | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useLockBodyScroll(true);

  useEffect(() => {
    TARGETS[kind].info(id)
      .then(async (i) => {
        setInfo(i);
        setQr(
          i.qr_image ??
            (i.upi_uri ? await QRCode.toDataURL(i.upi_uri, { width: 520, margin: 1, color: { dark: "#0b0809", light: "#ffffff" } }) : null),
        );
      })
      .catch((e) => setError(e instanceof ApiError && e.detail === "upi_not_configured" ? t("pay.notConfigured") : e.message));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, id, onClose, t]);

  async function copy() {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.upi_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the ID is visible to copy by hand
    }
  }

  async function paid(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await target.submit(id, reference);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  // Portal to <body>: an ancestor with backdrop-filter would otherwise become
  // the containing block for this fixed overlay and clip it.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 font-body text-cream sm:p-6">
      <button type="button" aria-label={t("nav.close")} onClick={onClose} className="fixed inset-0 bg-black/70" />
      <div role="dialog" aria-modal="true" aria-labelledby="pay-title"
        className="relative flex max-h-full w-full max-w-[520px] flex-col border border-line bg-ink shadow-2xl">
        <button type="button" onClick={onClose} aria-label={t("nav.close")}
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-cream/35 text-gold hover:border-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>

        <header className="shrink-0 border-b border-line px-7 pb-5 pt-7">
          <h2 id="pay-title" className="pr-12 font-display text-3xl uppercase tracking-[0.05em] text-gold">{t("pay.title")}</h2>
          {info && <p className="mt-2 text-2xl text-cream">{formatPrice(info.amount)}</p>}
        </header>

        <form onSubmit={paid} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 py-6">
            {error && !info ? (
              <p className="py-8 text-center leading-relaxed text-cream/80">{error}</p>
            ) : !info || !qr ? (
              <p className="py-16 text-center text-cream/60">{t("common.loading")}</p>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-center text-sm text-cream/75">{t(info.upi_uri ? "pay.scan" : "pay.scanUploaded")}</p>
                {!info.upi_uri && (
                  <p className="mt-3 border border-gold/50 bg-gold/10 px-4 py-2 text-center text-cream">
                    {t("pay.payExactly")} <strong className="text-gold">{formatPrice(info.amount)}</strong>
                  </p>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={t("pay.qrAlt")} className="mt-5 max-h-[300px] w-auto max-w-[260px] bg-white object-contain p-2" />
                <p className="mt-4 text-sm text-cream/60">{info.payee_name}</p>
                {info.upi_id && (
                <button type="button" onClick={copy}
                  className="mt-2 flex items-center gap-2 border border-line px-4 py-2 text-sm text-cream transition-colors hover:border-gold hover:text-gold">
                  <span className="font-mono">{info.upi_id}</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gold">{copied ? t("pay.copied") : t("pay.copy")}</span>
                </button>
                )}
                {info.upi_uri && (
                <a href={info.upi_uri}
                  className="mt-4 inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold hover:underline md:hidden">
                  {t("pay.openApp")}
                </a>
                )}

                <label className="mt-8 flex w-full flex-col gap-2">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/75">{t("pay.reference")}</span>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={64} inputMode="text"
                    placeholder={t("pay.referencePlaceholder")}
                    className="w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none placeholder:text-cream/45 focus:border-gold" />
                </label>
                <p className="mt-3 text-xs leading-relaxed text-cream/55">{t(target.afterNote)}</p>
              </div>
            )}
          </div>

          {info && qr && (
            <footer className="shrink-0 border-t border-line px-7 py-5">
              {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={busy}
                className="flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60">
                <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                {t("pay.iHavePaid")}
              </button>
            </footer>
          )}
        </form>
      </div>
    </div>,
    document.body,
  );
}
