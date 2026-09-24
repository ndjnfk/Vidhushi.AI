export type MoonVariant = "copper" | "grey" | "pearl";

// Pre-rendered moons (see lib/moonRenderer.ts): copper = large hero moon,
// grey = small accent, pearl = luminous full moon in the arch scene.
export default function Planet({ className = "", variant = "copper" }: { className?: string; variant?: MoonVariant }) {
  return (
    <div aria-hidden="true" className={`aspect-square rounded-full shadow-[0_-14px_50px_-18px_#ffc6a840] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static, already optimised */}
      <img src={`/moons/${variant}.webp`} alt="" width={640} height={640} decoding="async" draggable={false}
        className="h-full w-full select-none" />
    </div>
  );
}
