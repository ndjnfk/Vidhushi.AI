"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
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
      const res = await login(email, password);
      setToken(res.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <h1 className="text-2xl font-bold">{t("account.loginTitle")}</h1>
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
          placeholder={t("account.passwordPlaceholder")}
          className="border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={busy} className="bg-orange-600 text-white rounded px-4 py-2 disabled:opacity-50">
          {busy ? t("account.loggingIn") : t("account.loginButton")}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p className="text-sm text-gray-600">
        {t("account.noAccount")} <a href="/account/register" className="text-orange-600">{t("account.registerButton")}</a>
      </p>
    </div>
  );
}
