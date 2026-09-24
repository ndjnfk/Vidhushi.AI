"use client";

import { useEffect, useRef, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { deleteUpiQr, getUpiSettings, saveUpiSettings, uploadUpiQr, type UpiSettingsOut } from "../../_lib/api";

const MAX_BYTES = 2 * 1024 * 1024;
const INPUT = "w-full border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/45 focus:border-gold";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70";
const BTN = "inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// Vidushi Ji's UPI QR (from her bank/UPI app) and UPI ID, shown to clients
// when they pay for a consultation.
export default function AdminPaymentsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<UpiSettingsOut | null>(null);
  const [upiId, setUpiId] = useState("");
  const [payee, setPayee] = useState("Vidushi Ji");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  function apply(d: UpiSettingsOut) {
    setData(d);
    setUpiId(d.upi_id);
    setPayee(d.payee_name);
  }

  useEffect(() => {
    getUpiSettings().then(apply).catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, []);

  async function run(action: () => Promise<UpiSettingsOut>, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      apply(await action());
      setMsg({ ok: true, text: okText });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setMsg({ ok: false, text: t("adminPay.badType") });
      return;
    }
    if (f.size > MAX_BYTES) {
      setMsg({ ok: false, text: t("adminPay.tooBig") });
      return;
    }
    const url = await readAsDataUrl(f);
    await run(() => uploadUpiQr(url), t("adminPay.qrSaved"));
  }

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-4xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminPay.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminPay.intro")}</p>

        {!data ? (
          <p className="mt-10 text-cream/60">{msg?.text ?? t("common.loading")}</p>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* QR image */}
            <section className="border border-line bg-ink-soft/60 p-6">
              <h2 className={LABEL}>{t("adminPay.qrTitle")}</h2>
              <div className="mt-4 flex aspect-square items-center justify-center border border-dashed border-cream/25 bg-ink">
                {data.qr_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.qr_image} alt={t("pay.qrAlt")} className="max-h-full max-w-full bg-white object-contain p-2" />
                ) : (
                  <p className="px-6 text-center text-sm text-cream/50">{t("adminPay.noQr")}</p>
                )}
              </div>
              <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" disabled={busy} onClick={() => file.current?.click()} className={`${BTN} bg-white text-ink hover:bg-gold`}>
                  <Sparkle className="h-3 w-3 text-gold-deep" />
                  {t(data.qr_image ? "adminPay.replaceQr" : "adminPay.uploadQr")}
                </button>
                {data.qr_image && (
                  <button type="button" disabled={busy}
                    onClick={() => confirm(t("adminPay.removeConfirm")) && run(deleteUpiQr, t("adminPay.qrRemoved"))}
                    className={`${BTN} border border-line text-cream/75 hover:border-red-400 hover:text-red-300`}>
                    {t("adminPay.removeQr")}
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-cream/50">{t("adminPay.qrHint")}</p>
            </section>

            {/* UPI ID */}
            <section className="border border-line bg-ink-soft/60 p-6">
              <form onSubmit={(e) => { e.preventDefault(); run(() => saveUpiSettings(upiId, payee), t("adminPay.saved")); }}
                className="flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                  <span className={LABEL}>{t("adminPay.upiId")}</span>
                  <input className={INPUT} value={upiId} onChange={(e) => setUpiId(e.target.value)} maxLength={100}
                    placeholder="name@okhdfcbank" autoComplete="off" spellCheck={false} />
                  <span className="text-xs text-cream/50">{t("adminPay.upiIdHint")}</span>
                </label>
                <label className="flex flex-col gap-2">
                  <span className={LABEL}>{t("adminPay.payee")}</span>
                  <input className={INPUT} value={payee} onChange={(e) => setPayee(e.target.value)} maxLength={100} required />
                </label>
                <button type="submit" disabled={busy} className={`${BTN} self-start bg-white text-ink hover:bg-gold`}>
                  <Sparkle className="h-3 w-3 text-gold-deep" />
                  {t("common.save")}
                </button>
              </form>

              <div className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-cream/70">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{t("adminPay.clientSees")}</p>
                <p className="mt-2">
                  {data.qr_image ? t("adminPay.showsUploaded") : data.upi_id ? t("adminPay.showsGenerated") : t("adminPay.showsNothing")}
                </p>
              </div>
            </section>
          </div>
        )}

        {msg && data && (
          <p role="status" className={`mt-6 text-sm ${msg.ok ? "text-gold" : "text-red-400"}`}>{msg.text}</p>
        )}
      </div>
    </div>
  );
}
