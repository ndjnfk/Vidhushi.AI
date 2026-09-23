import { apiFetch } from "@/lib/api";

export interface TarotCardMeaningOut {
  name: string;
  arcana: string;
  suit: string | null;
  rank: string;
  keywords: string[];
  upright_meaning: string;
  reversed_meaning: string;
}

export interface DrawnCardOut {
  position: string;
  name: string;
  is_reversed: boolean;
  keywords: string[];
  meaning: string;
}

export interface TarotReadingOut {
  id: string;
  spread: string;
  question: string | null;
  cards: DrawnCardOut[];
  created_at: string;
}

export function getDeck(): Promise<TarotCardMeaningOut[]> {
  return apiFetch<TarotCardMeaningOut[]>("/tarot/deck");
}

export function drawReading(spread: string, question?: string): Promise<TarotReadingOut> {
  return apiFetch<TarotReadingOut>("/tarot/reading", {
    method: "POST",
    body: JSON.stringify({ spread, question: question || null }),
  });
}

export function getReading(id: string): Promise<TarotReadingOut> {
  return apiFetch<TarotReadingOut>(`/tarot/reading/${id}`);
}
