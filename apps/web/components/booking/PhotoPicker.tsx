"use client";

import { useRef, useState } from "react";
import { checkFace, type FaceCheck } from "@/lib/faceCheck";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const MAX_SIDE = 1600; // phone photos are huge; this is plenty to see a face clearly
const QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = src;
  });
}

// Re-encodes the photo as a JPEG no larger than MAX_SIDE, so uploads stay small.
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// The one required photo on a session/ritual request: the client's face,
// checked in the browser (one face, close enough, fully in frame, not too dark)
// before it's accepted. Kept as a data: URL until the form is sent.
export default function PhotoPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { t } = useLanguage();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<FaceCheck | "unreadable" | null>(null);
  const [unchecked, setUnchecked] = useState(false); // accepted, but the checker couldn't load

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setProblem(null);
    try {
      const dataUrl = await shrink(file);
      const result = await checkFace(await loadImage(dataUrl));
      if (result === "ok" || result === "unavailable") {
        onChange(dataUrl);
        setUnchecked(result === "unavailable");
      } else {
        setProblem(result);
      }
    } catch {
      setProblem("unreadable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-24 w-24 shrink-0 border border-gold/60 object-cover" />
        ) : (
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 border border-dashed border-cream/35 text-cream/70 transition-colors hover:border-gold hover:text-gold disabled:opacity-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-7 w-7" aria-hidden="true">
              <path d="M4 7h3l2-2h6l2 2h3v12H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            </svg>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.1em]">{t("booking.addPhoto")}</span>
          </button>
        )}
        <div className="min-w-0 text-sm">
          {busy ? (
            <p className="text-cream/70">{t("booking.photoChecking")}</p>
          ) : value ? (
            <>
              <p className={unchecked ? "text-cream/70" : "text-gold"}>{t(unchecked ? "booking.photoUnchecked" : "booking.photoOk")}</p>
              <button type="button" onClick={() => input.current?.click()}
                className="mt-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold hover:underline">
                {t("booking.changePhoto")}
              </button>
            </>
          ) : problem ? (
            <p className="text-red-400">{t(`booking.photoProblem.${problem}`)}</p>
          ) : null}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}
