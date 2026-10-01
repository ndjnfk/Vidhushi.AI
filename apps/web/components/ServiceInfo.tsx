import PostBody from "@/components/blog/PostBody";
import Sparkle from "@/components/Sparkle";
import { JsonLd } from "@/lib/seo";
import type { ServiceContent } from "@/lib/serviceContent";

// Explainer + FAQ under a service page. Server-rendered so search engines read
// it, with FAQPage structured data for the questions.
export default function ServiceInfo({ content }: { content: ServiceContent }) {
  return (
    <section id="guide" className="relative -mx-6 -mb-8 scroll-mt-24 border-t border-line bg-ink font-body text-cream">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <PostBody markdown={content.markdown} />

        <h2 className="mt-16 flex items-center gap-4 font-display text-[1.8rem] uppercase tracking-[0.04em] text-gold">
          <Sparkle className="h-3.5 w-3.5" />
          Frequently asked questions
        </h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {content.faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.1rem] text-cream marker:hidden hover:text-gold">
                <h3 className="font-body font-semibold">{f.q}</h3>
                <span aria-hidden="true" className="mt-1 text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-cream/80">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
