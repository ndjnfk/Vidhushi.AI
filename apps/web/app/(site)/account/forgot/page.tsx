"use client";

import Link from "next/link";
import { useState } from "react";
import PasswordInput from "@/components/account/PasswordInput";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { forgotQuestion, forgotReset, type SecurityQuestion } from "@/lib/securityQuestions";

const INPUT =
  "w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold";
const BUTTON =
  "mt-3 flex items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60";

// API error codes -> friendly text.
const ERRORS: Record<string, string> = {
  wrong_answer: "account.forgotWrongAnswer",
  too_many_attempts: "account.forgotLocked",
  no_security_question: "account.forgotNoQuestion",
};

// Forgot password: email -> the account's security question -> right answer
// and a new password -> signed in and sent to the home page.
export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState<SecurityQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = (e: unknown) =>
    e instanceof ApiError && ERRORS[e.detail] ? t(ERRORS[e.detail]) : e instanceof Error ? e.message : String(e);

  async function findQuestion(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setQuestion((await forgotQuestion(email.trim())).security_question);
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError(t("account.passwordsDontMatch"));
    setBusy(true);
    setError(null);
    try {
      setToken((await forgotReset(email.trim(), answer, password)).access_token);
      window.location.href = "/"; // full load so the header shows the new login
    } catch (err) {
      setError(explain(err));
      setBusy(false);
    }
  }

  return (
    <div className="relative -mx-6 -my-8 flex min-h-[calc(100vh-97px)] items-center justify-center overflow-hidden bg-ink px-6 py-20 font-body text-cream">
      <Starfield seed={67} />
      <Planet className="pointer-events-none absolute -right-[8%] -top-[10%] w-[min(34vw,440px)] opacity-80" />

      <div className="relative w-full max-w-[480px] border border-line bg-ink/85 p-8 backdrop-blur-sm md:p-12">
        <Sparkle className="h-6 w-6 text-gold" />
        <h1 className="mt-5 font-display text-4xl uppercase tracking-[0.05em] text-gold">{t("account.forgotTitle")}</h1>

        {!question ? (
          <form onSubmit={findQuestion} className="mt-8 flex flex-col gap-4">
            <p className="text-cream/75">{t("account.forgotIntro")}</p>
            <input type="email" autoComplete="email" placeholder={t("account.emailPlaceholder")} className={INPUT}
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" disabled={busy} className={BUTTON}>
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {busy ? t("common.loading") : t("account.forgotContinue")}
            </button>
          </form>
        ) : (
          <form onSubmit={reset} className="mt-8 flex flex-col gap-4">
            <p className="text-sm text-cream/60">{email}</p>
            <p className="text-lg text-cream">{t(`security.q.${question}`)}</p>
            <input className={INPUT} placeholder={t("account.securityAnswer")} value={answer} autoComplete="off"
              onChange={(e) => setAnswer(e.target.value)} required />
            <PasswordInput autoComplete="new-password" placeholder={t("account.newPassword")} className={INPUT}
              value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            <PasswordInput autoComplete="new-password" placeholder={t("account.confirmPassword")} className={INPUT}
              value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
            <button type="submit" disabled={busy} className={BUTTON}>
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {busy ? t("common.loading") : t("account.forgotReset")}
            </button>
          </form>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <p className="mt-8 text-sm text-cream/70">
          <Link href="/account/login" className="font-bold text-gold hover:underline">{t("account.backToLogin")}</Link>
        </p>
      </div>
    </div>
  );
}
