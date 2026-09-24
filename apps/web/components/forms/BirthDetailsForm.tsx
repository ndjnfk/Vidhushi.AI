"use client";

import { useState } from "react";
import Sparkle from "@/components/Sparkle";
import type { BirthDetailsIn } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PlaceSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  submitLabel?: string;
  onSubmit: (details: BirthDetailsIn) => void;
  busy?: boolean;
}

// Celestial-theme styles.
const c = {
  form: "flex flex-col gap-6",
  label: "text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/80",
  input:
    "w-full border border-line bg-transparent px-4 py-3.5 text-cream [color-scheme:dark] placeholder:text-cream/45 outline-none transition-colors focus:border-gold",
  hint: "text-xs text-cream/60",
  menu: "no-scrollbar absolute top-full left-0 right-0 z-10 mt-1 max-h-56 overflow-auto border border-line bg-ink-soft shadow-2xl",
  option: "cursor-pointer px-4 py-3 text-sm text-cream/90 transition-colors hover:bg-ink hover:text-gold",
  submit:
    "mt-2 flex items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-transparent disabled:text-cream/50",
};

export default function BirthDetailsForm({ submitLabel, onSubmit, busy }: Props) {
  const { t } = useLanguage();
  const resolvedSubmitLabel = submitLabel ?? t("kundli.generateButton");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [place, setPlace] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  async function searchPlace(query: string) {
    setPlaceQuery(query);
    setPlace(null);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      );
      const data: PlaceSuggestion[] = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(s: PlaceSuggestion) {
    setPlace({ name: s.display_name, lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
    setPlaceQuery(s.display_name);
    setSuggestions([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place) return;
    onSubmit({
      name,
      birth_date: birthDate,
      birth_time: birthTime.length === 5 ? `${birthTime}:00` : birthTime,
      place_name: place.name,
      latitude: place.lat,
      longitude: place.lon,
    });
  }

  return (
    <form onSubmit={handleSubmit} className={c.form}>
      <label className="flex flex-col gap-2">
        <span className={c.label}>{t("kundli.formName")}</span>
        <input
          className={c.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={c.label}>{t("kundli.formBirthDate")}</span>
        <input
          type="date"
          className={c.input}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={c.label}>{t("kundli.formBirthTime")}</span>
        <input
          type="time"
          step={60}
          className={c.input}
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
          required
        />
      </label>

      <label className="relative flex flex-col gap-2">
        <span className={c.label}>{t("kundli.formBirthPlace")}</span>
        <input
          className={c.input}
          value={placeQuery}
          onChange={(e) => searchPlace(e.target.value)}
          placeholder={t("kundli.formPlacePlaceholder")}
          required
        />
        {searching && <span className={c.hint}>{t("kundli.searching")}</span>}
        {suggestions.length > 0 && (
          <ul className={c.menu}>
            {suggestions.map((s, i) => (
              <li
                key={i}
                className={c.option}
                onClick={() => selectPlace(s)}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </label>

      <button
        type="submit"
        disabled={!place || busy}
        className={c.submit}
      >
        <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
        {busy ? t("kundli.calculating") : resolvedSubmitLabel}
      </button>
    </form>
  );
}
