export type MoonVariant = "copper" | "grey" | "pearl";

// Pre-rendered moons (see lib/moonRenderer.ts): copper = large hero moon,
// grey = small accent, pearl = luminous full moon in the arch scene.
// Drawn as a CSS background: the moon is pure decoration, so it shouldn't
// appear as an image to screen readers or SEO crawlers.
export default function Planet({ className = "", variant = "copper" }: { className?: string; variant?: MoonVariant }) {
  return (
    <div
      aria-hidden="true"
      className={`aspect-square select-none rounded-full bg-contain bg-center bg-no-repeat shadow-[0_-14px_50px_-18px_#ffc6a840] ${className}`}
      style={{ backgroundImage: `url(/moons/${variant}.webp)` }}
    />
  );
}
