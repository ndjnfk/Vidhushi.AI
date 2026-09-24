"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Planet from "@/components/Planet";
import Starfield from "@/components/Starfield";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useHomeContent } from "@/lib/useHomeContent";

const DURATION_MS = 1800;
const NUMBER = new Intl.NumberFormat("en-IN");

// Counts every stat up from 0 once the band scrolls into view (or shows the
// final values straight away when the visitor prefers reduced motion).
function useCountUp(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setProgress(1));
      return () => cancelAnimationFrame(id);
    }
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION_MS);
          setProgress(1 - Math.pow(1 - t, 3)); // ease-out cubic
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);

  return progress;
}

// Home-page band of headline numbers over a starfield with a large moon.
export default function Stats() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const progress = useCountUp(ref);
  const stats = useHomeContent()?.stats ?? [];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-t border-line bg-ink px-6 py-32 font-body text-cream md:py-48"
    >
      <Starfield seed={31} />
      <Planet className="pointer-events-none absolute -right-[34%] -top-[6%] w-[85vw] opacity-90 sm:-right-[16%] sm:-top-[45%] sm:w-[min(46vw,720px)]" />

      <dl className="relative mx-auto grid max-w-[1400px] gap-16 text-center sm:grid-cols-3 lg:pr-[8%]">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col-reverse items-center gap-4">
            <dt className="text-xl text-cream/90">{s.label}</dt>
            <dd className="font-display text-[3.8rem] leading-none md:text-[clamp(3rem,4.4vw,4.3rem)] text-gold tabular-nums">
              {NUMBER.format(Math.round(s.value * progress))}
              {s.suffix}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
