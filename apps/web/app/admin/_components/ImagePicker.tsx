"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const MAX_BYTES = 3 * 1024 * 1024;
const BTN = "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// Preview + upload/remove for one image. `upload` stores the file and
// returns its URL; `onChange(null)` falls back to the site's default image.
export default function ImagePicker({
  url, fallback, upload, onChange, aspect = "aspect-[3/4]", round = false,
}: {
  url: string | null;
  fallback?: string;
  upload: (dataUrl: string) => Promise<string>;
  onChange: (url: string | null) => void;
  aspect?: string;
  round?: boolean;
}) {
  const { t } = useLanguage();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shown = url ?? fallback ?? null;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) return setError(t("adminPay.badType"));
    if (f.size > MAX_BYTES) return setError(t("adminProducts.tooBig"));
    setBusy(true);
    setError(null);
    try {
      onChange(await upload(await readAsDataUrl(f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className={`${aspect} flex items-center justify-center overflow-hidden border border-dashed border-cream/25 bg-ink ${round ? "rounded-full" : ""}`}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className={`h-full w-full object-cover ${url ? "" : "opacity-60"}`} />
        ) : (
          <span className="px-3 text-center text-xs text-cream/45">{t("adminHome.defaultImage")}</span>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
          {busy ? "…" : t(url ? "adminProducts.changePhoto" : "adminProducts.uploadPhoto")}
        </button>
        {url && (
          <button type="button" onClick={() => onChange(null)} className={`${BTN} border border-line text-cream/60 hover:border-red-400 hover:text-red-300`}>
            {t("adminPay.removeQr")}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
