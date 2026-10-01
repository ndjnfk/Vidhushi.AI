import Link from "next/link";
import ReactMarkdown from "react-markdown";

// Article body: the admin's markdown, styled for the dark theme. Internal
// links use client-side navigation; external ones open in a new tab.
export default function PostBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-lg prose-invert max-w-none font-body prose-headings:font-display prose-headings:uppercase prose-headings:tracking-[0.04em] prose-headings:text-gold prose-h2:mt-12 prose-h2:text-[1.8rem] prose-h3:text-[1.35rem] prose-p:leading-relaxed prose-p:text-cream/85 prose-a:text-gold prose-a:underline-offset-4 hover:prose-a:text-cream prose-strong:text-cream prose-li:text-cream/85 prose-li:marker:text-gold prose-blockquote:border-gold prose-blockquote:font-normal prose-blockquote:text-cream/80 prose-hr:border-line prose-img:border prose-img:border-line">
      <ReactMarkdown
        components={{
          // The page title is the only <h1>; demote any "# heading" in the body.
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            ),
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
