"use client";

import { useState } from "react";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("kundli.formName")}</span>
        <input
          className="border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("kundli.formBirthDate")}</span>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("kundli.formBirthTime")}</span>
        <input
          type="time"
          step={60}
          className="border rounded px-3 py-2"
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 relative">
        <span className="text-sm font-medium">{t("kundli.formBirthPlace")}</span>
        <input
          className="border rounded px-3 py-2"
          value={placeQuery}
          onChange={(e) => searchPlace(e.target.value)}
          placeholder={t("kundli.formPlacePlaceholder")}
          required
        />
        {searching && <span className="text-xs text-gray-500">{t("kundli.searching")}</span>}
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 z-10 bg-white border rounded shadow max-h-48 overflow-auto">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
        className="bg-orange-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {busy ? t("kundli.calculating") : resolvedSubmitLabel}
      </button>
    </form>
  );
}
