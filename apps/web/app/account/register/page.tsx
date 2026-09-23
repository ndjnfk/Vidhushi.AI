"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await register(email, password);
      setToken(res.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <h1 className="text-2xl font-bold">{t("account.registerTitle")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder={t("account.emailPlaceholder")}
          className="border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("account.passwordMinPlaceholder")}
          className="border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <button type="submit" disabled={busy} className="bg-orange-600 text-white rounded px-4 py-2 disabled:opacity-50">
          {busy ? t("account.creating") : t("account.registerButton")}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p className="text-sm text-gray-600">
        {t("account.haveAccount")} <a href="/account/login" className="text-orange-600">{t("account.loginButton")}</a>
      </p>
    </div>
  );
}
