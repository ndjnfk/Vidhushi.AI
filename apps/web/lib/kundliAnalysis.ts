// Chart analysis for the kundli report: how well each life area is
// supported. Pure functions of KundliOut.

import type { KundliOut, PlanetOut } from "@/lib/api";
import type { Verdict } from "@/lib/kundliReading";
import type { AreaKey } from "@/lib/kundliReport";
import { rashiIndex } from "@/lib/rashi";

// Must stay in the same order as apps/api/app/astro/constants.py RASHI_LORDS
export const RASHI_LORDS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
export const PLANET_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
export const BENEFICS = new Set(["Jupiter", "Venus", "Mercury", "Moon"]);
const GOOD_HOUSES = new Set([1, 4, 5, 7, 9, 10, 11]);
const HARD_HOUSES = new Set([6, 8, 12]);

export function planetsByName(k: KundliOut): Record<string, PlanetOut> {
  return Object.fromEntries(k.d1_chart.planets.map((p) => [p.planet, p]));
}

// How well a planet supports what it rules: its dignity first, then its house.
export function verdictOf(p: PlanetOut | undefined): Verdict {
  if (!p) return "steady";
  if (p.dignity === "debilitated") return "effort";
  if (p.dignity === "exalted" || p.dignity === "own") return "strong";
  if (HARD_HOUSES.has(p.house)) return "effort";
  return GOOD_HOUSES.has(p.house) ? "supported" : "steady";
}

// Each life area is read from a house (through its ruling planet) or,
// for the mind, from the Moon itself.
const AREAS: { key: AreaKey; house?: number; planet?: string }[] = [
  { key: "health", house: 1 }, { key: "mind", planet: "Moon" }, { key: "wealth", house: 2 }, { key: "family", house: 4 },
  { key: "education", house: 5 }, { key: "marriage", house: 7 }, { key: "career", house: 10 }, { key: "luck", house: 9 },
  { key: "income", house: 11 }, { key: "travel", house: 12 },
];

export interface AreaResult {
  key: AreaKey;
  lord: string; // the ruling planet (or the Moon for the mind)
  verdict: Verdict;
  occupants: PlanetOut[]; // planets sitting in the area's house
}

export function analyseAreas(k: KundliOut): AreaResult[] {
  const by = planetsByName(k);
  const lagna = rashiIndex(k.d1_chart.ascendant_sign);
  return AREAS.map(({ key, house, planet }) => {
    if (planet) return { key, lord: planet, verdict: verdictOf(by[planet]), occupants: [] };
    const lord = RASHI_LORDS[(lagna + house! - 1) % 12];
    const occupants = PLANET_ORDER.map((n) => by[n]).filter((p) => p?.house === house);
    return { key, lord, verdict: verdictOf(by[lord]), occupants };
  });
}

export function lagnaLord(k: KundliOut): string {
  return RASHI_LORDS[rashiIndex(k.d1_chart.ascendant_sign)];
}

