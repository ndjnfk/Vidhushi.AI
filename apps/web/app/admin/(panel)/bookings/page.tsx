"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhotoGallery from "@/components/booking/PhotoGallery";
import StatusBadge from "@/components/booking/StatusBadge";
import Sparkle from "@/components/Sparkle";
import { formatDob, formatSlot, parseUtc, type BookingKind, type BookingStatus, type Channel, type ConsultationRequestOut } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice } from "@/lib/shop";
import { useTarotContent } from "@/lib/useTarotContent";
import { approveBooking, completeBooking, listBookings, markPaymentReceived, rejectBooking } from "../../_lib/api";
import StatusTabs, { MovedNotice } from "../../_components/StatusTabs";

// In the order a booking moves through them.
const TABS = ["pending", "approved", "payment_submitted", "confirmed", "completed", "closed", "all"] as const;
type Tab = (typeof TABS)[number];
const URGENT: Tab[] = ["pending", "payment_submitted"]; // waiting on Vidushi Ji
const tabOf = (s: BookingStatus): Tab => (s === "rejected" || s === "cancelled" ? "closed" : s);
type Moved = (id: string, status: BookingStatus) => void;
const INPUT = "w-full border border-line bg-transparent px-3 py-2.5 text-cream [color-scheme:dark] outline-none focus:border-gold";
const LABEL = "text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/65";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

function ApproveForm({ row, onDone }: { row: ConsultationRequestOut; onDone: Moved }) {
  const { t } = useLanguage();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(String(row.duration_minutes ?? 30));
  const { sessions } = useTarotContent();
  // Fee break-up; amounts kept as strings while typing. The total is their sum.
  const [fees, setFees] = useState<{ label: string; amount: string }[]>(() => {
    if (row.fee_items.length) return row.fee_items.map((f) => ({ label: f.label, amount: String(f.amount) }));
    const price = sessions.find((s) => s.id === row.session_id)?.price;
    const session = row.amount ?? price;
    if (row.kind === "ritual") {
      return [
        { label: t("fee.ritual"), amount: row.amount != null ? String(row.amount) : "" },
        { label: t("fee.platform"), amount: "0" },
      ];
    }
    return [
      { label: t("fee.session"), amount: session != null ? String(session) : "" },
      { label: t("fee.platform"), amount: "0" },
    ];
  });
  const total = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  // Rituals: Vidushi Ji picks how the client can reach her once confirmed.
  const [channels, setChannels] = useState<Channel[]>(row.channels.length ? row.channels : ["chat"]);
  const setFee = (i: number, patch: Partial<{ label: string; amount: string }>) =>
    setFees((cur) => cur.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const [note, setNote] = useState(row.admin_note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // The admin enters her local time; the API stores UTC.
      const scheduled = new Date(`${date}T${time}`);
      await approveBooking(row.id, {
        scheduled_at: scheduled.toISOString(), duration_minutes: Number(duration), note,
        fee_items: fees.map((f) => ({ label: f.label.trim(), amount: Number(f.amount) || 0 })),
        ...(row.kind === "ritual" ? { channels } : {}),
      });
      onDone(row.id, "approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    const reason = prompt(t("admin.rejectReason"), "");
    if (reason === null) return;
    setBusy(true);
    try {
      await rejectBooking(row.id, reason);
      onDone(row.id, "rejected");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={approve} className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>{t(row.kind === "ritual" ? "admin.ritualDate" : "admin.date")}</span>
        <input type="date" className={INPUT} value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>{t("admin.time")}</span>
        <input type="time" className={INPUT} value={time} onChange={(e) => setTime(e.target.value)} required />
      </label>
      {row.kind === "ritual" ? (
        <div aria-hidden="true" className="hidden lg:block" />
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>{t("booking.duration")}</span>
          <select className={`${INPUT} bg-ink`} value={duration} onChange={(e) => setDuration(e.target.value)}>
            {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} {t("booking.minutes")}</option>)}
          </select>
        </label>
      )}
      <div className="flex flex-col justify-end gap-1.5">
        <span className={LABEL}>{t("fee.total")}</span>
        <p className="border border-gold/50 bg-gold/10 px-3 py-2.5 font-display text-xl text-gold">{formatPrice(total)}</p>
      </div>
      <fieldset className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
        <legend className={`${LABEL} mb-1.5`}>{t("fee.breakUp")}</legend>
        {fees.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2">
            <input className={INPUT} value={f.label} maxLength={60} required aria-label={t("fee.item")} placeholder={t("fee.item")}
              onChange={(e) => setFee(i, { label: e.target.value })} />
            <input type="number" min={0} step={1} className={INPUT} value={f.amount} required aria-label={`${f.label} (₹)`} placeholder="₹"
              onChange={(e) => setFee(i, { amount: e.target.value })} />
            <button type="button" disabled={fees.length === 1} onClick={() => setFees((cur) => cur.filter((_, j) => j !== i))}
              aria-label={t("adminSite.remove")} title={t("adminSite.remove")}
              className="flex w-11 items-center justify-center border border-line text-cream/60 hover:border-red-400 hover:text-red-300 disabled:opacity-30">
              ✕
            </button>
          </div>
        ))}
        {fees.length < 8 && (
          <button type="button" onClick={() => setFees((cur) => [...cur, { label: "", amount: "" }])}
            className="self-start text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold hover:underline">
            + {t("fee.addLine")}
          </button>
        )}
      </fieldset>
      {row.kind === "ritual" && (
        <fieldset className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
          <legend className={`${LABEL} mb-1.5`}>{t("adminTarot.channels")}</legend>
          <div className="flex flex-wrap gap-2">
            {(["chat", "audio", "video"] as const).map((ch) => {
              const on = channels.includes(ch);
              const only = on && channels.length === 1;
              return (
                <button key={ch} type="button" aria-pressed={on} disabled={only} title={only ? t("adminTarot.channelsMin") : undefined}
                  onClick={() => setChannels((cur) => (["chat", "audio", "video"] as const).filter((c) => (c === ch ? !on : cur.includes(c))))}
                  className={`flex items-center gap-2 border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed ${
                    on ? "border-gold bg-gold/15 text-gold" : "border-line text-cream/60 hover:border-cream/40"
                  }`}>
                  <span aria-hidden="true">{on ? "✓" : "+"}</span>
                  {t(`adminTarot.channel.${ch}`)}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-cream/50">{t("admin.ritualChannelsHint")}</p>
        </fieldset>
      )}
      <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
        <span className={LABEL}>{t("admin.noteToClient")}</span>
        <input className={INPUT} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </label>
      <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
        <button type="submit" disabled={busy} className={`${BTN} bg-white text-ink hover:bg-gold`}>
          <Sparkle className="h-3 w-3 text-gold-deep" />
          {t(row.status === "approved" ? "admin.update" : "admin.approve")}
        </button>
        <button type="button" onClick={reject} disabled={busy} className={`${BTN} border border-line text-cream/80 hover:border-red-400 hover:text-red-300`}>
          {t("admin.reject")}
        </button>
      </div>
      {error && <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-4">{error}</p>}
    </form>
  );
}

function Row({ row, onChange, focused }: { row: ConsultationRequestOut; onChange: Moved; focused: boolean }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused]);
  return (
    <li ref={ref} className={`border bg-ink-soft/60 p-6 transition-[border-color,box-shadow] duration-700 md:p-8 ${
      focused ? "border-gold shadow-[0_0_0_1px_var(--color-gold),0_0_40px_-12px_var(--color-gold)]" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl uppercase tracking-[0.04em] text-gold">{row.name}</p>
          <p className="mt-1 text-sm text-cream/60">
            {t(`booking.topic.${row.topic}`)} · {t("booking.requestedOn")} {formatSlot(row.created_at)}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
        <div><dt className="text-cream/55">{t("booking.email")}</dt><dd><a className="text-cream hover:text-gold" href={`mailto:${row.email}`}>{row.email}</a></dd></div>
        <div><dt className="text-cream/55">{t("booking.phone")}</dt><dd><a className="text-cream hover:text-gold" href={`tel:${row.phone}`}>{row.phone}</a></dd></div>
        <div><dt className="text-cream/55">{t("booking.place")}</dt><dd className="text-cream">{row.place}</dd></div>
        {row.dob && <div><dt className="text-cream/55">{t("booking.dob")}</dt><dd className="text-cream">{formatDob(row.dob)}</dd></div>}
        {row.photo_count > 0 && (
          <div className="sm:col-span-3">
            <dt className="mb-2 text-cream/55">{t("booking.photosLabel")}</dt>
            <dd><PhotoGallery id={row.id} viewer="admin" name={row.name} /></dd>
          </div>
        )}
        {row.kind === "ritual" && row.status !== "pending" && (
          <div className="sm:col-span-3">
            <dt className="text-cream/55">{t("booking.includes")}</dt>
            <dd className="text-cream">{row.channels.map((c) => t(`adminTarot.channel.${c}`)).join(", ")}</dd>
          </div>
        )}
        {row.session_id && (
          <div className="sm:col-span-3">
            <dt className="text-cream/55">{t("booking.includes")}</dt>
            <dd className="text-cream">
              {row.session_name && <span className="text-gold">{row.session_name} · </span>}
              {row.channels.map((c) => t(`adminTarot.channel.${c}`)).join(", ")}
            </dd>
          </div>
        )}
        {row.message && <div className="sm:col-span-3"><dt className="text-cream/55">{t("booking.message")}</dt><dd className="whitespace-pre-wrap text-cream">{row.message}</dd></div>}
        {row.scheduled_at && (
          <div className="sm:col-span-3">
            <dt className="text-cream/55">{t("booking.when")}</dt>
            <dd className="text-gold">
              {formatSlot(row.scheduled_at)} · {row.duration_minutes} {t("booking.minutes")} · {row.amount != null ? formatPrice(row.amount) : "—"}
            </dd>
          </div>
        )}
      </dl>

      {(row.status === "approved" || row.status === "payment_submitted") && (
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <div className="mr-auto text-sm">
            <p className={row.status === "payment_submitted" ? "text-gold" : "text-cream/65"}>
              {t(row.status === "payment_submitted" ? "admin.clientSaysPaid" : "admin.awaitingPayment")}
            </p>
            {row.payment_reference && <p className="mt-1 text-cream/75">{t("pay.reference")}: <span className="font-mono">{row.payment_reference}</span></p>}
          </div>
          <button type="button"
            onClick={async () => {
              if (!confirm(t("admin.confirmReceived"))) return;
              await markPaymentReceived(row.id);
              onChange(row.id, "confirmed");
            }}
            className={`${BTN} bg-white text-ink hover:bg-gold`}>
            <Sparkle className="h-3 w-3 text-gold-deep" />
            {t("admin.paymentReceived")}
          </button>
          <Link href={`/admin/chats?id=${row.id}`} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
            {t("chat.title")}
          </Link>
        </div>
      )}

      {(row.status === "pending" || row.status === "approved") && <ApproveForm row={row} onDone={onChange} />}
      {row.status === "payment_submitted" && (
        <button type="button"
          onClick={async () => {
            const reason = prompt(t("admin.rejectReason"), "");
            if (reason === null) return;
            await rejectBooking(row.id, reason);
            onChange(row.id, "rejected");
          }}
          className={`${BTN} mt-4 border border-line text-cream/70 hover:border-red-400 hover:text-red-300`}>
          {t("admin.reject")}
        </button>
      )}

      {row.status === "confirmed" && (
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
          {row.channels.includes("video") && (
            <Link href={`/admin/bookings/${row.id}/call?mode=video`} className={`${BTN} bg-white text-ink hover:bg-gold`}>
              <Sparkle className="h-3 w-3 text-gold-deep" />
              {t("booking.joinVideo")}
            </Link>
          )}
          {row.channels.includes("audio") && (
            <Link href={`/admin/bookings/${row.id}/call?mode=audio`} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
              {t("booking.joinAudio")}
            </Link>
          )}
          {row.channels.includes("chat") && (
            <Link href={`/admin/chats?id=${row.id}`} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
              {t("chat.title")}
            </Link>
          )}
          <button type="button" onClick={async () => { await completeBooking(row.id); onChange(row.id, "completed"); }}
            className={`${BTN} border border-line text-cream/75 hover:border-gold hover:text-gold`}>
            {t("admin.markCompleted")}
          </button>
        </div>
      )}
    </li>
  );
}

// Consultations and ritual requests share this page's flow (approve with a
// fee break-up, UPI payment, chat); each kind has its own admin page.
export function AdminBookings({ kind }: { kind: BookingKind }) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<Tab | null>(null);
  const [all, setAll] = useState<ConsultationRequestOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  // Everything is loaded once and filtered here, so tabs switch instantly
  // and each tab can show its count.
  const load = useCallback(() => {
    listBookings(kind).then(setAll).catch((e: Error) => setError(e.message));
  }, [kind]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(TABS.map((k) => [k, 0])) as Record<Tab, number>;
    for (const r of all ?? []) c[tabOf(r.status)]++;
    c.all = all?.length ?? 0;
    return c;
  }, [all]);

  // Until the admin picks a tab, open where work is waiting.
  const tab: Tab = picked ?? (["pending", "payment_submitted", "confirmed"] as Tab[]).find((k) => counts[k] > 0) ?? "pending";

  // After an action, follow the booking to the tab it now belongs to.
  const moved = useCallback<Moved>((id, status) => {
    const next = tabOf(status);
    load();
    setPicked(next);
    setFocusId(id);
    setNotice(`${t("admin.nowIn")} ${next === "closed" ? t("admin.tabClosed") : t(`booking.status.${next}`)}`);
  }, [load, t]);

  const rows = all?.filter((r) => tab === "all" || tabOf(r.status) === tab) ?? null;
  // Soonest sessions first among confirmed ones; newest requests first otherwise.
  const sorted = tab === "confirmed" && rows
    ? [...rows].sort((a, b) => parseUtc(a.scheduled_at ?? a.created_at).getTime() - parseUtc(b.scheduled_at ?? b.created_at).getTime())
    : rows;

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t(kind === "ritual" ? "admin.ritualsTitle" : "admin.bookingsTitle")}</h1>

        <StatusTabs
          active={tab}
          onSelect={(k) => { setPicked(k); setFocusId(null); setNotice(null); }}
          tabs={TABS.map((k) => ({
            key: k,
            label: k === "all" ? t("shop.categoryAll") : k === "closed" ? t("admin.tabClosed") : t(`booking.status.${k}`),
            count: counts[k],
            urgent: URGENT.includes(k),
          }))}
        />
        <MovedNotice text={notice} onClose={clearNotice} />

        {!sorted ? (
          <p className="mt-10 text-cream/70">{error ?? t("common.loading")}</p>
        ) : sorted.length === 0 ? (
          <p className="mt-10 text-cream/70">{t("admin.empty")}</p>
        ) : (
          <ul className="mt-8 flex flex-col gap-5">
            {sorted.map((r) => <Row key={r.id} row={r} onChange={moved} focused={r.id === focusId} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  return <AdminBookings kind="consultation" />;
}
