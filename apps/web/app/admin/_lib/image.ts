// Photos straight from a phone or camera are often 1–5 MB and far larger than
// the site ever shows them. Before upload, scale them down so the longest side
// is at most `maxSide` px and re-encode as WebP — usually 5–10x smaller.

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // the API's limit
const MAX_INPUT_BYTES = 20 * 1024 * 1024; // what we're willing to shrink
const TYPES = ["image/png", "image/jpeg", "image/webp"];

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Checks, shrinks and encodes an image file; returns a data: URL to upload. */
export async function prepareImage(file: File, maxSide = 1200): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Upload a PNG, JPEG or WebP image");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Image is larger than 20 MB");

  let out: Blob = file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // Browsers without WebP encoding hand back a PNG; fall back to JPEG then.
    let blob = await toBlob(canvas, "image/webp", 0.82);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85);
    // Keep the original if it was already small and the re-encode isn't smaller.
    if (blob && (scale < 1 || blob.size < file.size)) out = blob;
  } catch {
    // Couldn't decode in the browser: upload the file as it is.
  }

  if (out.size > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 3 MB");
  return readAsDataUrl(out);
}
