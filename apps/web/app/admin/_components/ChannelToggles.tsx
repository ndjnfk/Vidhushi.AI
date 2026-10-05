"use client";

import type { Channel } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const ALL: Channel[] = ["chat", "audio", "video"];

// Chat / audio call / video call on-off buttons; at least one stays on.
export default function ChannelToggles({ value, onChange, disabled }: { value: Channel[]; onChange: (v: Channel[]) => void; disabled?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {ALL.map((ch) => {
        const on = value.includes(ch);
        const only = on && value.length === 1;
        return (
          <button key={ch} type="button" aria-pressed={on} disabled={disabled || only} title={only ? t("adminTarot.channelsMin") : undefined}
            onClick={() => onChange(ALL.filter((c) => (c === ch ? !on : value.includes(c))))}
            className={`flex items-center gap-2 border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed ${
              on ? "border-gold bg-gold/15 text-gold" : "border-line text-cream/60 hover:border-cream/40"
            }`}>
            <span aria-hidden="true">{on ? "✓" : "+"}</span>
            {t(`adminTarot.channel.${ch}`)}
          </button>
        );
      })}
    </div>
  );
}
