import Planet from "@/components/Planet";

// Night scene for the arch (home About section, Rituals): starry dusk sky,
// hills with a temple and flickering diyas, plus a luminous full moon. The
// scene is an image (public/home/arch-scene.svg) so its 15 KB of drawing isn't
// repeated inside the page HTML; the drawing lives in
// components/art/ArchSceneArt.tsx and `npm run art` regenerates the file.
export default function ArchScene() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/home/arch-scene.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <Planet variant="pearl" className="absolute left-[33%] top-[16%] w-[34%] shadow-[0_0_80px_10px_#fff1dc40]" />
    </div>
  );
}
