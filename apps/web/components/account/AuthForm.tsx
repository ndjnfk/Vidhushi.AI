"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { login, register } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Only same-site paths, so ?next= can't bounce users to another domain.
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const INPUT =
  "w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextQuery, setNextQuery] = useState("");
  const [needsLoginNotice, setNeedsLoginNotice] = useState(false);

  useEffect(() => {
    const next = safeNext();
    // Carry ?next= across the login <-> register switch.
    const id = requestAnimationFrame(() => {
      setNextQuery(next === "/" ? "" : `?next=${encodeURIComponent(next)}`);
      setNeedsLoginNotice(next !== "/");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = mode === "login" ? await login(email, password) : await register(email, password);
      setToken(res.access_token);
      // Full navigation so the header re-reads the new login state.
      window.location.href = safeNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "login" ? "Login failed" : "Registration failed");
      setBusy(false);
    }
  }

  const isLogin = mode === "login";
  return (
    <div className="relative -mx-6 -my-8 flex min-h-[calc(100vh-97px)] items-center justify-center overflow-hidden bg-ink px-6 py-20 font-body text-cream">
      <Starfield seed={67} />
      <Planet className="pointer-events-none absolute -right-[8%] -top-[10%] w-[min(34vw,440px)] opacity-80" />

      <div className="relative w-full max-w-[480px] border border-line bg-ink/85 p-8 backdrop-blur-sm md:p-12">
        <Sparkle className="h-6 w-6 text-gold" />
        <h1 className="mt-5 font-display text-4xl uppercase tracking-[0.05em] text-gold">
          {t(isLogin ? "account.loginTitle" : "account.registerTitle")}
        </h1>
        {needsLoginNotice && <p className="mt-4 text-cream/80">{t("account.loginToContinue")}</p>}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input type="email" autoComplete="email" placeholder={t("account.emailPlaceholder")} className={INPUT}
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={t(isLogin ? "account.passwordPlaceholder" : "account.passwordMinPlaceholder")} className={INPUT}
            value={password} onChange={(e) => setPassword(e.target.value)} minLength={isLogin ? undefined : 8} required />
          <button type="submit" disabled={busy}
            className="mt-3 flex items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60">
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {busy ? t(isLogin ? "account.loggingIn" : "account.creating") : t(isLogin ? "account.loginButton" : "account.registerButton")}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <p className="mt-8 text-sm text-cream/70">
          {t(isLogin ? "account.noAccount" : "account.haveAccount")}{" "}
          <Link href={`/account/${isLogin ? "register" : "login"}${nextQuery}`} className="font-bold text-gold hover:underline">
            {t(isLogin ? "account.registerButton" : "account.loginButton")}
          </Link>
        </p>
      </div>
    </div>
  );
}
