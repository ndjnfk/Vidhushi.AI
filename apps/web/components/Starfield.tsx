"use client";

import { useEffect, useRef } from "react";
import { makeNoise } from "@/lib/noise";

// Deep-space backdrop: smoky nebula haze, a dense field of faint stars and a
// few bright ones with soft glow and diffraction spikes. Fills its parent.
function draw(canvas: HTMLCanvasElement, seed: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width: w, height: h } = canvas.getBoundingClientRect();
  if (!w || !h) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { fbm, rand } = makeNoise(seed);

  ctx.fillStyle = "#070506";
  ctx.fillRect(0, 0, w, h);

  // Smoke/nebula at quarter resolution — it's soft anyway — then scaled up
  // smoothly. It gathers in the top-left and bottom-right corners and fades
  // to a faint haze elsewhere.
  const nw = Math.ceil(w / 4), nh = Math.ceil(h / 4);
  const neb = document.createElement("canvas");
  neb.width = nw;
  neb.height = nh;
  const nctx = neb.getContext("2d")!;
  const img = nctx.createImageData(nw, nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const u = x / 120, v = y / 120;
      // Domain warp bends the smoke; the ridged term (1 - |n|) turns noise
      // into thin wisps, over a faint base haze.
      const wx = fbm(u + 3.1, v, 0.5, 3), wy = fbm(u, v + 5.7, 0.5, 3);
      const n = fbm(u + wx * 1.2, v + wy * 1.2, 1.3, 5);
      const ridge = Math.max(0, 1 - Math.abs(n) * 2.4);
      const wisp = ridge ** 5;
      const haze = Math.max(0, n + 0.1) * 0.5;
      const fx = x / nw, fy = y / nh;
      const corner = (cx: number, cy: number) => Math.max(0, 1 - Math.hypot((fx - cx) / 0.48, (fy - cy) / 0.36));
      const mask = 0.02 + 1.1 * Math.max(corner(0, 0.02), corner(0.8, 1)) ** 1.6;
      const a = (wisp * 0.85 + haze) * mask;
      const o = (y * nw + x) * 4;
      img.data[o] = 162;
      img.data[o + 1] = 168;
      img.data[o + 2] = 180;
      img.data[o + 3] = Math.min(255, a * 115);
    }
  }
  nctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // A light blur keeps the wisps soft-edged.
  ctx.filter = "blur(2.5px)";
  ctx.drawImage(neb, 0, 0, w, h);
  ctx.filter = "none";

  // Faint background stars, denser and dimmer as they get smaller.
  const count = Math.round((w * h) / 1500);
  for (let i = 0; i < count; i++) {
    const r = 0.25 + Math.pow(rand(), 5) * 1.1;
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = rand() < 0.15 ? "#dfe6ff" : "#ffffff";
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A handful of bright stars with glow and cross spikes.
  const bright = Math.max(2, Math.round((w * h) / 130000));
  for (let i = 0; i < bright; i++) {
    const x = rand() * w, y = rand() * h, s = 0.8 + rand() * 1.1;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 7);
    glow.addColorStop(0, "rgba(255,255,255,0.9)");
    glow.addColorStop(0.2, "rgba(220,230,255,0.35)");
    glow.addColorStop(1, "rgba(220,230,255,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, s * 7, 0, Math.PI * 2);
    ctx.fill();

    const len = s * (6 + rand() * 6);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const g = ctx.createLinearGradient(x - dx * len, y - dy * len, x + dx * len, y + dy * len);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - dx * len, y - dy * len);
      ctx.lineTo(x + dx * len, y + dy * len);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

export default function Starfield({ className = "", seed = 7 }: { className?: string; seed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastW = 0, lastH = 0;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (Math.abs(width - lastW) < 1 && Math.abs(height - lastH) < 1) return;
      lastW = width;
      lastH = height;
      clearTimeout(timer);
      timer = setTimeout(() => {
        draw(canvas, seed);
        canvas.style.opacity = "1";
      }, 120);
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [seed]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700 ${className}`}
    />
  );
}
