// Generator for the moon images in public/moons/*.webp. Rendering one takes
// about a second of CPU, so the site ships the finished images instead of
// running this in every visitor's browser.
//
// To change a moon: edit VARIANTS here, then in the browser console of a dev
// page run renderMoon("copper").toDataURL("image/webp", 0.9) (after
// importing this module) and save the result over public/moons/copper.webp.
import { makeNoise } from "@/lib/noise";

const SIZE = 640;

const VARIANTS = {
  // Large mauve-copper moon (home hero, header drawer).
  copper: { seed: 11, color: [150, 104, 96], craters: 42, light: [-0.45, -0.8, 0.4] },
  // Small grey moon accent.
  grey: { seed: 29, color: [150, 150, 156], craters: 26, light: [-0.45, -0.8, 0.4] },
  // Luminous, almost-full moon (home arch scene).
  pearl: { seed: 5, color: [262, 246, 222], craters: 30, light: [-0.22, -0.28, 0.93] },
} as const;

export type MoonVariant = keyof typeof VARIANTS;

// Ray-casts a lit sphere: terrain and craters live on the 3D surface, so they
// foreshorten toward the limb and the ball reads as round, not as a flat disc.
export function renderMoon(variant: MoonVariant): HTMLCanvasElement {
  const { seed, color, craters: craterCount, light: lightDir } = VARIANTS[variant];
  const { fbm, rand } = makeNoise(seed);
  const R = SIZE / 2;

  const craters = Array.from({ length: craterCount }, () => {
    const z = rand() * 2 - 1, t = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z);
    const size = 0.02 + Math.pow(rand(), 2.6) * 0.12; // angular radius
    return { x: r * Math.cos(t), y: r * Math.sin(t), z, size, reach: Math.cos(size * 1.5) };
  });

  const height = new Float32Array(SIZE * SIZE);
  const tone = new Float32Array(SIZE * SIZE);

  const surface = (px: number, py: number) => {
    let nx = (px + 0.5 - R) / R, ny = (py + 0.5 - R) / R;
    const r = Math.hypot(nx, ny);
    if (r > 1) { nx /= r; ny /= r; }
    return { nx, ny, nz: Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), r };
  };

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const { nx, ny, nz, r } = surface(px, py);
      if (r > 1 + 2 / R) continue;
      const i = py * SIZE + px;

      let h = fbm(nx * 3, ny * 3, nz * 3, 5) * 0.16 + fbm(nx * 18, ny * 18, nz * 18, 3) * 0.03;
      for (const c of craters) {
        const d = nx * c.x + ny * c.y + nz * c.z;
        if (d < c.reach) continue;
        const t = Math.acos(Math.min(1, d)) / c.size;
        h += c.size * ((t < 1 ? (t * t - 1) * 0.35 : 0) + 0.16 * Math.exp(-((t - 1) * (t - 1)) / 0.03));
      }
      height[i] = h;
      // Broad darker "maria" patches plus fine surface grain.
      tone[i] = 0.84 + fbm(nx * 1.4 + 7, ny * 1.4, nz * 1.4, 3) * 0.5 + fbm(nx * 40, ny * 40, nz * 40, 2) * 0.12;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(SIZE, SIZE);

  const lLen = Math.hypot(...lightDir);
  const Lx = lightDir[0] / lLen, Ly = lightDir[1] / lLen, Lz = lightDir[2] / lLen;
  const rimLen = Math.hypot(Lx, Ly) || 1;
  const bump = 0.1;
  const at = (x: number, y: number, fallback: number) =>
    x < 0 || y < 0 || x >= SIZE || y >= SIZE ? fallback : height[y * SIZE + x] || fallback;

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const { nx, ny, nz, r } = surface(px, py);
      if (r > 1 + 2 / R) continue;
      const i = py * SIZE + px;
      const h = height[i];

      const hx = (at(px + 1, py, h) - at(px - 1, py, h)) * R * 0.5;
      const hy = (at(px, py + 1, h) - at(px, py - 1, h)) * R * 0.5;
      let mx = nx - bump * hx * nz, my = ny - bump * hy * nz, mz = nz;
      const mLen = Math.hypot(mx, my, mz) || 1;
      mx /= mLen; my /= mLen; mz /= mLen;

      const diffuse = Math.max(0, mx * Lx + my * Ly + mz * Lz);
      const ambient = 0.08 + 0.07 * nz;
      // Soft limb darkening keeps the ball from looking like a lit disc.
      const light = (ambient + diffuse * 0.98) * (0.72 + 0.28 * Math.sqrt(nz));
      // Thin bright rim where the lit limb curves away from the viewer.
      const rim = Math.pow(1 - nz, 6) * Math.max(0, (nx * Lx + ny * Ly) / rimLen) * 0.75;

      const k = tone[i] * light;
      const o = i * 4;
      img.data[o] = Math.min(255, color[0] * k + 250 * rim);
      img.data[o + 1] = Math.min(255, color[1] * k + 212 * rim);
      img.data[o + 2] = Math.min(255, color[2] * k + 196 * rim);
      img.data[o + 3] = 255 * Math.min(1, Math.max(0, (1 - r) * R + 0.5));
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
