// Gold line-art glyphs for the tarot modalities and guidance areas.
const PATHS: Record<string, string> = {
  // modalities
  tarot: "M8 4h11v18H8zM5 6.5 8 6M5 6.5l2.5 14M13.5 9l1 2.5 2.5.5-2 1.6.6 2.6-2.1-1.4-2.1 1.4.6-2.6-2-1.6 2.5-.5z",
  runes: "M6 3h12l2 9-2 9H6l-2-9zM10 7v10M10 9l4-2M10 12l4 2",
  oracle: "M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v2M12 20v2",
  dice: "M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10M8 7.2h.01M12 5.5h.01M16 7.2h.01M7 13.5h.01M8.5 16h.01M15 14h.01M17 16.5h.01",
  cartomancy: "M5 3h14v18H5zM12 7c-1.8 2-4 3.3-4 5.3A2 2 0 0 0 11.4 14L10.5 17h3l-.9-3A2 2 0 0 0 16 12.3C16 10.3 13.8 9 12 7Z",
  palmistry: "M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.6 7-6.3 7-2.3 0-3.7-1-5-3L3.5 13.8a1.5 1.5 0 0 1 2.4-1.7L8 14.5M10 17.5c1.4-.8 2.8-.8 4.2 0",
  numerology: "M4 4h16v16H4zM10 8.5a2 2 0 1 1 4 0c0 1.6-4 3.4-4 6.5h4M4 12h1.5M18.5 12H20M12 4v1.5M12 18.5V20",
  any: "M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z",
  // areas
  love: "M12 20.5S3.5 15.3 3.5 9.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.2c0 6.1-8.5 11.3-8.5 11.3Z",
  career: "M3.5 8h17v11.5h-17zM9 8V5.5h6V8M3.5 13h17M11 12h2v2.5h-2z",
  health: "M12 21c0-5 0-9 0-11M12 10C9 10 5.5 8 5.5 3.5 9.5 3.5 12 6 12 10ZM12 13.5c3 0 6.5-2 6.5-6.5-4 0-6.5 2.5-6.5 6.5ZM7 21h10",
};

export default function OfferingIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.any} />
    </svg>
  );
}
