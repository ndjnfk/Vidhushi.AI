"use client";

import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { adminLogin } from "../_lib/api";
import { getAdminToken, setAdminToken } from "../_lib/session";

const INPUT =
  "w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold";

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin/bookings";
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getAdminToken()) window.location.replace(nextPath());
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminLogin(email, password);
      setAdminToken(res.access_token);
      window.location.replace(nextPath());
    } catch {
      setError("Invalid email or password, or this account is not an admin.");
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <Starfield seed={83} />
      <div className="relative w-full max-w-[440px] border border-line bg-ink/90 p-8 backdrop-blur-sm md:p-12">
        <p className="relative inline-block pr-4 font-logo text-3xl tracking-[0.04em]">
          VIDUSHI JI
          <Sparkle className="absolute -top-1 right-0 h-3.5 w-3.5" />
        </p>
        <p className="mt-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-gold">Admin panel</p>

        <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
          <input type="email" autoComplete="username" placeholder="Admin email" className={INPUT}
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" autoComplete="current-password" placeholder="Password" className={INPUT}
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={busy}
            className="mt-3 flex items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60">
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
