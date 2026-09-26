"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { bookingPhotos } from "@/app/admin/_lib/api";
import { getMyPhotos } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// "data:image/jpeg;base64,..." + "Asha Verma" -> "asha-verma-photo.jpg"
function fileName(dataUrl: string, base: string, index: number, total: number): string {
  const type = dataUrl.slice(5, dataUrl.indexOf(";"));
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  return `${slug}-photo${total > 1 ? `-${index + 1}` : ""}.${EXT[type] ?? "jpg"}`;
}

const DOWNLOAD = "inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-gold hover:underline";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

// Thumbnails of the photos a client attached to a request; click to enlarge,
// or download. Photos are private, so they're fetched with the viewer's own login.
export default function PhotoGallery({ id, viewer, name = "" }: { id: string; viewer: "client" | "admin"; name?: string }) {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    (viewer === "admin" ? bookingPhotos(id) : getMyPhotos(id)).then(setPhotos).catch(() => setPhotos([]));
  }, [id, viewer]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!photos) return <p className="text-sm text-cream/50">{t("common.loading")}</p>;
  if (!photos.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {photos.map((src, i) => (
          <div key={i} className="flex flex-col items-start gap-2">
            <button type="button" onClick={() => setOpen(i)}
              className="h-20 w-20 overflow-hidden border border-line transition-colors hover:border-gold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${t("booking.photosLabel")} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
            <a href={src} download={fileName(src, name, i, photos.length)} className={DOWNLOAD}>
              <DownloadIcon />
              {t("booking.downloadPhoto")}
            </a>
          </div>
        ))}
      </div>
      {open !== null && createPortal(
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-black/85 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open]} alt="" className="max-h-[85vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          <a href={photos[open]} download={fileName(photos[open], name, open, photos.length)} onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 bg-white px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink hover:bg-gold">
            <DownloadIcon />
            {t("booking.downloadPhoto")}
          </a>
          <button type="button" aria-label={t("nav.close")} onClick={() => setOpen(null)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-cream/35 text-gold hover:border-gold">
            ✕
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
