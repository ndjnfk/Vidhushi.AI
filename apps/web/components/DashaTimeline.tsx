"use client";

import { useState } from "react";
import type { MahadashaOut } from "@/lib/api";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function DashaTimeline({ dasha }: { dasha: MahadashaOut[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">Vimshottari Dasha</h3>
      <ul className="divide-y border rounded">
        {dasha.map((m, i) => (
          <li key={i}>
            <button
              className="w-full flex justify-between px-3 py-2 text-left hover:bg-gray-50"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span className="font-medium">{m.lord} Mahadasha</span>
              <span className="text-sm text-gray-600">
                {fmt(m.start)} &ndash; {fmt(m.end)}
              </span>
            </button>
            {openIndex === i && (
              <ul className="bg-gray-50 px-6 py-2 flex flex-col gap-1">
                {m.antardashas.map((a, j) => (
                  <li key={j} className="flex justify-between text-sm">
                    <span>{a.lord} Antardasha</span>
                    <span className="text-gray-600">
                      {fmt(a.start)} &ndash; {fmt(a.end)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
