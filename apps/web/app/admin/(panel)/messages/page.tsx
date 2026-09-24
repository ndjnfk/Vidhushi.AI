"use client";

import { useCallback, useEffect, useState } from "react";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { listMessages, setMessageHandled, type ContactMessageOut } from "../../_lib/api";

const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors";

// Contact-form messages, newest first; "done" ones are dimmed.
export default function AdminMessagesPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ContactMessageOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listMessages().then(setRows).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminMessages.title")}</h1>

        {!rows ? (
          <p className="mt-10 text-cream/70">{error ?? t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-10 text-cream/70">{t("admin.empty")}</p>
        ) : (
          <ul className="mt-10 flex flex-col gap-5">
            {rows.map((m) => (
              <li key={m.id} className={`border border-line bg-ink-soft/60 p-6 md:p-8 ${m.handled ? "opacity-55" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">{m.name}</p>
                    <p className="mt-1 text-sm text-cream/60">
                      {parseUtc(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      {" · "}<a href={`mailto:${m.email}`} className="text-cream hover:text-gold">{m.email}</a>
                      {m.phone && <>{" · "}<a href={`tel:${m.phone}`} className="text-cream hover:text-gold">{m.phone}</a></>}
                    </p>
                  </div>
                  {m.handled && (
                    <span className="border border-line px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{t("adminMessages.done")}</span>
                  )}
                </div>
                <p className="mt-5 whitespace-pre-line leading-relaxed text-cream/90">{m.message}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Vidushi Ji")}`}
                    className={`${BTN} bg-white text-ink hover:bg-gold`}>
                    {t("adminMessages.reply")}
                  </a>
                  <button type="button" onClick={async () => { await setMessageHandled(m.id, !m.handled); load(); }}
                    className={`${BTN} border border-line text-cream/75 hover:border-gold hover:text-gold`}>
                    {t(m.handled ? "adminMessages.markOpen" : "adminMessages.markDone")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
