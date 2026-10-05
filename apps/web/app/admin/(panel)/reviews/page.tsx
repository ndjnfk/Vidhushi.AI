"use client";

import { useEffect, useState } from "react";
import Stars from "@/components/reviews/Stars";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { INPUT, LABEL } from "../../_components/ContentEditor";
import { addAdminReview, deleteReview, listAdminReviews, setReviewHidden, type AdminReviewIn, type AdminReviewOut } from "../../_lib/api";

const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";
const FILTERS = ["all", "visible", "hidden"] as const;
type Filter = (typeof FILTERS)[number];

const KINDS = ["consultation", "ritual", "order"] as const;
const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local
const blank = (): AdminReviewIn => ({ name: "", rating: 5, text: "", label: "", target_kind: "consultation", given_on: today() });

// Vidushi Ji adds a review herself, e.g. from a client from before the website.
function AddReviewForm({ onAdded, onCancel }: { onAdded: (r: AdminReviewOut) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [f, setF] = useState<AdminReviewIn>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<AdminReviewIn>) => setF((cur) => ({ ...cur, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onAdded(await addAdminReview({ ...f, given_on: f.given_on || undefined }));
      setF(blank());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-5 border border-gold/40 bg-ink-soft/60 p-6 sm:grid-cols-2">
      <p className="text-sm text-cream/70 sm:col-span-2">{t("adminReviews.addHint")}</p>
      <label className="flex flex-col gap-2">
        <span className={LABEL}>{t("adminReviews.clientName")}</span>
        <input className={INPUT} value={f.name} maxLength={60} required placeholder="Priya S." onChange={(e) => set({ name: e.target.value })} />
      </label>
      <label className="flex flex-col gap-2">
        <span className={LABEL}>{t("adminReviews.service")}</span>
        <input className={INPUT} value={f.label} maxLength={80} required placeholder={t("adminReviews.servicePlaceholder")} onChange={(e) => set({ label: e.target.value })} />
      </label>
      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t("review.rating")}</span>
        <div className="py-2"><Stars value={f.rating} size="h-7 w-7" onPick={(rating) => set({ rating })} label={t("review.rating")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t("adminReviews.type")}</span>
          <select className={`${INPUT} bg-ink`} value={f.target_kind} onChange={(e) => set({ target_kind: e.target.value as AdminReviewIn["target_kind"] })}>
            {KINDS.map((k) => <option key={k} value={k}>{t(`adminReviews.kind.${k}`)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t("adminReviews.date")}</span>
          <input type="date" className={`${INPUT} [color-scheme:dark]`} value={f.given_on ?? ""} max={today()} onChange={(e) => set({ given_on: e.target.value })} />
        </label>
      </div>
      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className={LABEL}>{t("adminReviews.reviewText")}</span>
        <textarea className={`${INPUT} min-h-28 resize-y`} value={f.text} minLength={3} maxLength={1000} required onChange={(e) => set({ text: e.target.value })} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={`${BTN} bg-white text-ink hover:bg-gold`}>{t("adminReviews.addSubmit")}</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-line text-cream/70 hover:border-cream/40`}>{t("common.cancel")}</button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </form>
  );
}

// Every review: Hide takes one off the public pages (reversible), Delete
// removes it for good. Vidushi Ji can also add reviews herself.
export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AdminReviewOut[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    listAdminReviews().then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  async function run(id: string, action: () => Promise<void>) {
    setBusy(id);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const toggle = (r: AdminReviewOut) => run(r.id, async () => {
    const updated = await setReviewHidden(r.id, !r.hidden);
    setRows((cur) => cur && cur.map((x) => (x.id === r.id ? updated : x)));
  });

  const remove = (r: AdminReviewOut) => {
    if (!confirm(t("adminReviews.deleteConfirm").replace("{name}", r.name))) return;
    run(r.id, async () => {
      await deleteReview(r.id);
      setRows((cur) => cur && cur.filter((x) => x.id !== r.id));
    });
  };

  const counts = {
    all: rows?.length ?? 0,
    visible: rows?.filter((r) => !r.hidden).length ?? 0,
    hidden: rows?.filter((r) => r.hidden).length ?? 0,
  };
  const shown = rows?.filter((r) => filter === "all" || (filter === "hidden") === r.hidden) ?? null;

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminReviews.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminReviews.intro")}</p>

        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setNotice(null); }} className={`${BTN} mt-6 bg-white text-ink hover:bg-gold`}>
            + {t("adminReviews.add")}
          </button>
        )}
        {adding && (
          <AddReviewForm
            onCancel={() => setAdding(false)}
            onAdded={(r) => {
              setRows((cur) => [r, ...(cur ?? [])].sort((a, b) => parseUtc(b.created_at).getTime() - parseUtc(a.created_at).getTime()));
              setAdding(false);
              setNotice(t("adminReviews.added").replace("{name}", r.name));
            }}
          />
        )}
        {notice && <p role="status" className="mt-4 text-sm text-gold">{notice}</p>}

        <div className="mt-8 flex flex-wrap gap-2" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={`border px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
                filter === f ? "border-gold bg-gold/15 text-gold" : "border-line text-cream/70 hover:border-cream/40"
              }`}>
              {t(`adminReviews.filter.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>

        {!shown ? (
          <p className="mt-10 text-cream/70">{error ?? t("common.loading")}</p>
        ) : shown.length === 0 ? (
          <p className="mt-10 text-cream/70">{t("review.none")}</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {shown.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-start gap-4 border p-6 ${r.hidden ? "border-line opacity-60" : "border-line bg-ink-soft/60"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars value={r.rating} />
                    <span className="text-sm text-cream/60">
                      <span className="font-bold text-cream">{r.name}</span> · {r.label} · {t(`adminReviews.kind.${r.target_kind}`)} ·{" "}
                      {parseUtc(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {r.added_by_admin && <span className="border border-gold/40 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gold/80">{t("adminReviews.addedBadge")}</span>}
                    {r.hidden && <span className="border border-line px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-cream/60">{t("adminReviews.hiddenBadge")}</span>}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-cream/90">&ldquo;{r.text}&rdquo;</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => toggle(r)} disabled={busy === r.id}
                    className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
                    {t(r.hidden ? "adminReviews.show" : "adminReviews.hide")}
                  </button>
                  <button type="button" onClick={() => remove(r)} disabled={busy === r.id}
                    className={`${BTN} border border-line text-cream/70 hover:border-red-400 hover:text-red-300`}>
                    {t("adminReviews.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {rows && error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
