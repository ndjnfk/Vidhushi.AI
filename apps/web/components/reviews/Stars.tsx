// Five gold stars, `value` of them filled. Pass `onPick` to make them clickable.
export default function Stars({
  value, size = "h-4 w-4", onPick, label,
}: {
  value: number;
  size?: string;
  onPick?: (n: number) => void;
  label?: string;
}) {
  const star = (filled: boolean) => (
    <svg viewBox="0 0 24 24" className={`${size} ${filled ? "fill-gold text-gold" : "fill-none text-cream/35"}`} stroke="currentColor"
      strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
    </svg>
  );
  if (!onPick) {
    return <span className="inline-flex gap-0.5" role="img" aria-label={label ?? `${value}/5`}>{[1, 2, 3, 4, 5].map((n) => <span key={n}>{star(n <= value)}</span>)}</span>;
  }
  return (
    <span className="inline-flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}/5`} onClick={() => onPick(n)}
          className="transition-transform hover:scale-110">
          {star(n <= value)}
        </button>
      ))}
    </span>
  );
}
