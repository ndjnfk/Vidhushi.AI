// Tarot sessions and healing-ritual intentions shown on /tarot and /rituals.
// Display text lives in the i18n dictionaries under the `key` prefix
// (`${key}.name`, `${key}.desc`); the booking form sends the English name
// to Vidushi Ji so requests read the same whatever the visitor's language.

export interface TarotSession {
  id: string;
  key: string;
  price: number | null; // null = quoted after enquiry
  group: "call" | "reading" | "area";
}

export const TAROT_SESSIONS: TarotSession[] = [
  { id: "call-15", key: "offer.call15", price: 999, group: "call" },
  { id: "call-30", key: "offer.call30", price: 2999, group: "call" },
  { id: "call-60", key: "offer.call60", price: 3999, group: "call" },
  { id: "video", key: "offer.video", price: 4999, group: "call" },
  { id: "forecast", key: "offer.forecast", price: 1599, group: "reading" },
  { id: "general", key: "offer.general", price: 999, group: "reading" },
  { id: "monthly", key: "offer.monthly", price: 999, group: "reading" },
  { id: "month-ahead", key: "offer.monthAhead", price: 999, group: "reading" },
  { id: "area-love", key: "offer.areaLove", price: null, group: "area" },
  { id: "area-career", key: "offer.areaCareer", price: null, group: "area" },
  { id: "area-health", key: "offer.areaHealth", price: null, group: "area" },
];

export const MODALITIES = ["tarot", "runes", "oracle", "dice", "cartomancy", "palmistry", "numerology"] as const;

export const RITUAL_INTENTIONS = [
  "health",
  "finance",
  "career",
  "love",
  "legal",
  "exams",
  "family",
  "travel",
  "success",
  "urgent",
  "other",
] as const;

export type RitualIntention = (typeof RITUAL_INTENTIONS)[number];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
