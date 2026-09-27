// Vimshottari sub-periods below the Antardasha (Pratyantar, Sookshma,
// Prana). The API sends Mahadashas with their Antardashas; each deeper level
// splits its parent the same way: nine periods starting from the parent's
// lord, each lasting the parent's length × (lord's years / 120).

import type { KundliOut } from "@/lib/api";

// Must match DASHA_LORD_SEQUENCE / VIMSHOTTARI_YEARS in apps/api/app/astro/constants.py
const SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const YEARS: Record<string, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

export const DASHA_DEPTH = 5; // Mahadasha, Antardasha, Pratyantar, Sookshma, Prana

export interface DashaNode {
  lord: string;
  start: string;
  end: string;
  antardashas?: DashaNode[]; // only on Mahadashas (from the API)
}

export function subPeriods(parent: DashaNode): DashaNode[] {
  const start = Date.parse(parent.start);
  const span = Date.parse(parent.end) - start;
  const first = SEQUENCE.indexOf(parent.lord);
  let cursor = start;
  return SEQUENCE.map((_, i) => {
    const lord = SEQUENCE[(first + i) % 9];
    const end = cursor + span * (YEARS[lord] / 120);
    const node = { lord, start: new Date(cursor).toISOString(), end: new Date(end).toISOString() };
    cursor = end;
    return node;
  });
}

// The periods one level below `path` (the chosen period at each level so far).
export function childrenOf(k: KundliOut, path: DashaNode[]): DashaNode[] {
  if (path.length === 0) return k.dasha;
  const last = path[path.length - 1];
  return last.antardashas ?? subPeriods(last);
}

export function isRunning(n: DashaNode, now: number): boolean {
  return Date.parse(n.start) <= now && now < Date.parse(n.end);
}

// The running period at every level, Mahadasha first.
export function runningChain(k: KundliOut, now: number): DashaNode[] {
  const chain: DashaNode[] = [];
  while (chain.length < DASHA_DEPTH) {
    const next = childrenOf(k, chain).find((n) => isRunning(n, now));
    if (!next) break;
    chain.push(next);
  }
  return chain;
}
