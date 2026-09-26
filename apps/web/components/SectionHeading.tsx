import Sparkle from "@/components/Sparkle";

// Centred gold section title with the sparkle ornament, used on the service pages.
export default function SectionHeading({ title, subtitle, className = "" }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      <div className="flex items-center justify-center gap-4 text-gold" aria-hidden="true">
        <span className="h-px w-12 bg-gold/50" />
        <Sparkle className="h-3.5 w-3.5" />
        <span className="h-px w-12 bg-gold/50" />
      </div>
      <h2 className="mt-5 font-display text-[clamp(2rem,3.6vw,3.2rem)] uppercase leading-[1.1] tracking-[0.04em] text-gold">{title}</h2>
      {subtitle && <p className="mt-5 text-[1.1rem] leading-relaxed text-cream/80">{subtitle}</p>}
    </div>
  );
}
