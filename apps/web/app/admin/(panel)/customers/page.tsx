"use client";

import { useEffect, useState } from "react";
import PasswordInput from "@/components/account/PasswordInput";
import Sparkle from "@/components/Sparkle";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SECURITY_QUESTIONS } from "@/lib/securityQuestions";
import { adminSetPassword, adminSetSecurity, listAdminUsers, type AdminUserOut } from "../../_lib/api";

const INPUT = "w-full border border-line bg-transparent px-3 py-2.5 text-cream outline-none placeholder:text-cream/40 focus:border-gold";
const LABEL = "text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/65";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

function Customer({ u, onSaved }: { u: AdminUserOut; onSaved: (u: AdminUserOut) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [question, setQuestion] = useState<string>(u.security_question || SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(action: () => Promise<AdminUserOut>, done: string) {
    setBusy(true);
    setMsg(null);
    try {
      onSaved(await action());
      setMsg({ ok: true, text: t(done) });
      setPassword("");
      setAnswer("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border border-line bg-ink-soft/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-cream">{u.email} {u.is_admin && <span className="ml-2 border border-gold/50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-gold">Admin</span>}</p>
          <p className="mt-1 text-sm text-cream/55">
            {t("adminCustomers.joined")} {parseUtc(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {" · "}
            {u.security_question ? t(`security.q.${u.security_question}`) : t("adminCustomers.noQuestion")}
          </p>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
          {t(open ? "nav.close" : "adminCustomers.manage")}
        </button>
      </div>

      {open && (
        <div className="mt-5 grid gap-6 border-t border-line pt-5 md:grid-cols-2">
          <form className="flex flex-col gap-2"
            onSubmit={(e) => { e.preventDefault(); run(() => adminSetPassword(u.id, password), "adminCustomers.passwordSaved"); }}>
            <span className={LABEL}>{t("adminCustomers.newPassword")}</span>
            <PasswordInput className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
              autoComplete="new-password" placeholder={t("account.passwordMinPlaceholder")} />
            <button type="submit" disabled={busy} className={`${BTN} mt-1 self-start bg-white text-ink hover:bg-gold`}>
              <Sparkle className="h-3 w-3 text-gold-deep" />
              {t("adminCustomers.setPassword")}
            </button>
          </form>
          <form className="flex flex-col gap-2"
            onSubmit={(e) => { e.preventDefault(); run(() => adminSetSecurity(u.id, question, answer), "adminCustomers.securitySaved"); }}>
            <span className={LABEL}>{t("account.securityQuestion")}</span>
            <select className={`${INPUT} bg-ink`} value={question} onChange={(e) => setQuestion(e.target.value)}>
              {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{t(`security.q.${q}`)}</option>)}
            </select>
            <input className={INPUT} value={answer} onChange={(e) => setAnswer(e.target.value)} required minLength={2} maxLength={100}
              autoComplete="off" placeholder={t("adminCustomers.newAnswer")} />
            <button type="submit" disabled={busy} className={`${BTN} mt-1 self-start border border-cream/40 hover:border-gold hover:text-gold`}>
              {t("adminCustomers.setSecurity")}
            </button>
          </form>
          {msg && <p className={`text-sm md:col-span-2 ${msg.ok ? "text-gold" : "text-red-400"}`}>{msg.text}</p>}
        </div>
      )}
    </li>
  );
}

// Customer accounts: find one by email, then set a new password and/or a new
// security question and answer (for clients who forgot both).
export default function AdminCustomersPage() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminUserOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      listAdminUsers(q).then(setRows).catch((e: Error) => setError(e.message));
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminCustomers.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminCustomers.intro")}</p>

        <input className={`${INPUT} mt-8 max-w-md`} type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t("adminCustomers.search")} aria-label={t("adminCustomers.search")} />

        {!rows ? (
          <p className="mt-8 text-cream/70">{error ?? t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-cream/70">{t("admin.empty")}</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {rows.map((u) => (
              <Customer key={u.id} u={u} onSaved={(nu) => setRows((cur) => cur && cur.map((x) => (x.id === nu.id ? nu : x)))} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
