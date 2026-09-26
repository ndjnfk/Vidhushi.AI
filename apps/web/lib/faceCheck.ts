"use client";

import type { FaceDetector } from "@mediapipe/tasks-vision";

// Checks, in the visitor's browser, that a booking photo shows one clear face.
// The photo never leaves the page for this. MediaPipe's engine (wasm) comes from
// the jsDelivr CDN; the small face model is served by the site itself.
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL = "/models/blaze_face_short_range.tflite";
const MIN_SCORE = 0.6;
const MIN_FACE_AREA = 0.04; // face box vs whole photo: smaller means too far away
const EDGE_MARGIN = 0.01; // the detector clips its box to the photo, so touching an edge = cut off
const MIN_BRIGHTNESS = 55; // 0–255 average over the face

export type FaceCheck = "ok" | "none" | "many" | "small" | "cut" | "dark" | "unavailable";

let detector: Promise<FaceDetector> | null = null;

// MediaPipe's engine prints routine status lines through console.error/warn
// ("INFO: Created TensorFlow Lite XNNPACK delegate…", "W0926 … gl_context.cc…").
// They aren't errors, but Next's dev overlay shows them as one. Drop just those.
const ENGINE_LOG = /^(INFO:|[IWE]\d{4} \d{2}:\d{2}:\d{2}\.\d+ +\d+ \w+\.cc:\d+\])/;

async function quietly<T>(run: () => T | Promise<T>): Promise<T> {
  const { error, warn } = console;
  const filter = (log: (...a: unknown[]) => void) => (...args: unknown[]) => {
    if (typeof args[0] === "string" && ENGINE_LOG.test(args[0])) return;
    log(...args);
  };
  console.error = filter(error);
  console.warn = filter(warn);
  try {
    return await run();
  } finally {
    console.error = error;
    console.warn = warn;
  }
}

function loadDetector(): Promise<FaceDetector> {
  detector ??= quietly(async () => {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
      runningMode: "IMAGE",
      minDetectionConfidence: MIN_SCORE,
    });
  }).catch((e) => {
    detector = null; // let a later photo try again
    throw e;
  });
  return detector;
}

function brightness(img: HTMLImageElement, x: number, y: number, w: number, h: number): number {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, x, y, w, h, 0, 0, 32, 32);
  const px = ctx.getImageData(0, 0, 32, 32).data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  return sum / (px.length / 4);
}

export async function checkFace(img: HTMLImageElement): Promise<FaceCheck> {
  let d: FaceDetector;
  try {
    d = await loadDetector();
  } catch {
    return "unavailable";
  }
  const found = await quietly(() => d.detect(img).detections);
  const faces = found.filter((f) => (f.categories[0]?.score ?? 0) >= MIN_SCORE);
  if (faces.length === 0) return "none";
  if (faces.length > 1) return "many";
  const box = faces[0].boundingBox;
  if (!box) return "ok";
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if ((box.width * box.height) / (W * H) < MIN_FACE_AREA) return "small";
  if (box.originX <= EDGE_MARGIN * W || box.originY <= EDGE_MARGIN * H
    || box.originX + box.width >= W * (1 - EDGE_MARGIN) || box.originY + box.height >= H * (1 - EDGE_MARGIN)) return "cut";
  const x = Math.max(0, box.originX);
  const y = Math.max(0, box.originY);
  if (brightness(img, x, y, Math.min(box.width, W - x), Math.min(box.height, H - y)) < MIN_BRIGHTNESS) return "dark";
  return "ok";
}
