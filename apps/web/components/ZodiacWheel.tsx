// Gold rashi chakra, loaded as an image (public/home/zodiac-wheel.svg) so its
// 12 KB of drawing isn't repeated inside every page's HTML. The drawing lives
// in components/art/ZodiacWheelArt.tsx; `npm run art` regenerates the file.
export default function ZodiacWheel({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/home/zodiac-wheel.svg" alt="" aria-hidden="true" className={className} />;
}
