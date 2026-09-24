import Planet from "@/components/Planet";
import { makeNoise } from "@/lib/noise";

// Night scene for the home hero arch: starry dusk sky, a luminous full moon,
// hills with a temple silhouette and a row of flickering diyas. Drawn in a
// 400×500 viewBox, which matches the arch's proportions.

const { rand } = makeNoise(3);
const STARS = Array.from({ length: 150 }, () => ({
  x: rand() * 400,
  y: Math.pow(rand(), 1.4) * 360,
  r: 0.3 + Math.pow(rand(), 4) * 1.3,
  o: 0.35 + rand() * 0.6,
}));

const DIYAS = [
  { x: 64, y: 458, s: 1 },
  { x: 112, y: 468, s: 1.15 },
  { x: 162, y: 460, s: 0.95 },
];

function Diya({ x, y, s, delay }: { x: number; y: number; s: number; delay: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cy="-10" r="30" fill="url(#as-diya-glow)" />
      <path d="M-18 0 Q0 22 18 0 Q0 6 -18 0Z" fill="url(#as-brass)" />
      <path d="M-18 0 Q0 6 18 0" fill="none" stroke="#f6dcae" strokeWidth="0.8" opacity="0.7" />
      <path
        className="animate-flicker"
        style={{ animationDelay: delay }}
        d="M0 -1 C-5 -8 -3 -16 0 -26 C3 -16 5 -8 0 -1Z"
        fill="url(#as-flame)"
      />
    </g>
  );
}

export default function ArchScene() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="as-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0a14" />
            <stop offset="0.45" stopColor="#23172a" />
            <stop offset="0.72" stopColor="#4a2c35" />
            <stop offset="0.82" stopColor="#8a5540" />
          </linearGradient>
          <radialGradient id="as-moon-glow">
            <stop offset="0" stopColor="#fff4e0" stopOpacity="0.5" />
            <stop offset="0.35" stopColor="#f3d9b8" stopOpacity="0.18" />
            <stop offset="1" stopColor="#f3d9b8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="as-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4d2b0" stopOpacity="0" />
            <stop offset="0.5" stopColor="#f4d2b0" stopOpacity="0.22" />
            <stop offset="1" stopColor="#f4d2b0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="as-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6c08a" />
            <stop offset="1" stopColor="#6b4a2e" />
          </linearGradient>
          <linearGradient id="as-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff7a1a" />
            <stop offset="0.45" stopColor="#ffb347" />
            <stop offset="1" stopColor="#fff6d8" />
          </linearGradient>
          <radialGradient id="as-diya-glow">
            <stop offset="0" stopColor="#ffb347" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="500" fill="url(#as-sky)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} fill="#fff" opacity={s.o.toFixed(2)} />
        ))}
        <circle cx="200" cy="150" r="170" fill="url(#as-moon-glow)" />

        {/* Far hills */}
        <path d="M0 372 C60 340 120 352 180 364 S300 332 400 350 L400 500 L0 500Z" fill="#2c1b24" />
        <rect y="340" width="400" height="70" fill="url(#as-mist)" />

        {/* Temple on the near hill */}
        <g fill="#150c11">
          <path d="M0 404 C80 386 160 392 240 392 S340 380 400 388 L400 500 L0 500Z" />
          <rect x="262" y="378" width="78" height="10" />
          <rect x="268" y="354" width="30" height="24" />
          <path d="M268 354 Q283 336 298 354Z" />
          <rect x="296" y="342" width="38" height="36" />
          <path d="M296 342 C298 302 306 278 315 264 C324 278 332 302 334 342Z" />
          <ellipse cx="315" cy="262" rx="8" ry="3.2" />
          <path d="M311 259 Q315 249 319 259Z" />
          <rect x="314.4" y="228" width="1.2" height="24" />
          <path d="M315.6 229 L332 234 L315.6 240Z" />
        </g>
        {/* Warm light in the temple doorway */}
        <rect x="310" y="362" width="10" height="16" rx="5" fill="#ffb347" opacity="0.75" />

        {DIYAS.map((d, i) => (
          <Diya key={i} {...d} delay={`${i * 0.37}s`} />
        ))}
      </svg>

      <Planet variant="pearl" className="absolute left-[33%] top-[16%] w-[34%] shadow-[0_0_80px_10px_#fff1dc40]" />
    </div>
  );
}
