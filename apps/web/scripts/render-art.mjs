// Renders the decorative drawings in components/art/ to static SVG files in
// public/home/, which pages load as images. Run after editing a drawing:
//   npm run art
import { writeFileSync } from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const root = path.resolve(import.meta.dirname, "..");
const jiti = createJiti(import.meta.url, { alias: { "@": root }, jsx: true });
const React = await jiti.import("react");
globalThis.React = React; // the drawings use the classic JSX runtime here
const { renderToStaticMarkup } = await jiti.import("react-dom/server");

// The diya flames' flicker (from globals.css), carried inside the image.
const FLICKER =
  "<style>@media (prefers-reduced-motion:no-preference){.animate-flicker{transform-box:fill-box;transform-origin:center bottom;animation:flicker 1.6s ease-in-out infinite}}" +
  "@keyframes flicker{0%,100%{transform:scale(1,1) skewX(0deg);opacity:1}25%{transform:scale(.94,1.06) skewX(-3deg);opacity:.92}50%{transform:scale(1.04,.95) skewX(2deg);opacity:1}75%{transform:scale(.97,1.03) skewX(-1deg);opacity:.95}}</style>";

const ART = [
  ["components/art/ZodiacWheelArt.tsx", "public/home/zodiac-wheel.svg", ""],
  ["components/art/ArchSceneArt.tsx", "public/home/arch-scene.svg", FLICKER],
];

for (const [src, out, extra] of ART) {
  const Art = (await jiti.import(path.join(root, src))).default;
  const svg = renderToStaticMarkup(React.createElement(Art))
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace("<defs>", `${extra}<defs>`);
  writeFileSync(path.join(root, out), svg);
  console.log(`${out}: ${(svg.length / 1024).toFixed(1)} KB`);
}
