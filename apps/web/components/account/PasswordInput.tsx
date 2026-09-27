"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// A password box with an eye button to show/hide what was typed.
export default function PasswordInput({ className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { t } = useLanguage();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={`${className ?? ""} pr-12`} />
      <button type="button" onClick={() => setShown((s) => !s)} aria-pressed={shown}
        aria-label={t(shown ? "account.hidePassword" : "account.showPassword")} title={t(shown ? "account.hidePassword" : "account.showPassword")}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-cream/60 transition-colors hover:text-gold">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {shown && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}
