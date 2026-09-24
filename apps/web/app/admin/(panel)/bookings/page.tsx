"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StatusBadge from "@/components/booking/StatusBadge";
import Sparkle from "@/components/Sparkle";
import { formatSlot, parseUtc, type BookingStatus, type ConsultationRequestOut } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice } from "@/lib/shop";
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
  const [amount, setAmount] = useState(row.amount != null ? String(row.amount) : "");
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
        scheduled_at: scheduled.toISOString(), duration_minutes: Number(duration), amount: Number(amount), note,
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
        <span className={LABEL}>{t("admin.date")}</span>
        <input type="date" className={INPUT} value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>{t("admin.time")}</span>
        <input type="time" className={INPUT} value={time} onChange={(e) => setTime(e.target.value)} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>{t("booking.duration")}</span>
        <select className={`${INPUT} bg-ink`} value={duration} onChange={(e) => setDuration(e.target.value)}>
          {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} {t("booking.minutes")}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>{t("booking.fee")} (₹)</span>
        <input type="number" min={0} step={1} className={INPUT} value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
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
          <Link href={`/admin/bookings/${row.id}/call?mode=video`} className={`${BTN} bg-white text-ink hover:bg-gold`}>
            <Sparkle className="h-3 w-3 text-gold-deep" />
            {t("booking.joinVideo")}
          </Link>
          <Link href={`/admin/bookings/${row.id}/call?mode=audio`} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
            {t("booking.joinAudio")}
          </Link>
          <Link href={`/admin/chats?id=${row.id}`} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
            {t("chat.title")}
          </Link>
          <button type="button" onClick={async () => { await completeBooking(row.id); onChange(row.id, "completed"); }}
            className={`${BTN} border border-line text-cream/75 hover:border-gold hover:text-gold`}>
            {t("admin.markCompleted")}
          </button>
        </div>
      )}
    </li>
  );
}

export default function AdminBookingsPage() {
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
    listBookings().then(setAll).catch((e: Error) => setError(e.message));
  }, []);

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
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("admin.bookingsTitle")}</h1>

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
