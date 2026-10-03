// frontend/src/lib/imageCompress.ts

/**
 * Downscale and re-encode a photo so it's small enough to send over the
 * network without losing readability for handwritten math.
 *
 * - maxDim:   longest side in pixels. 1600 keeps most handwriting legible
 *             while cutting a 4000px photo down to ~10% of its bytes.
 * - quality:  JPEG quality (0–1). 0.8 is visually near-lossless for photos
 *             but roughly 3–5× smaller than the default 0.92.
 *
 * Returns a data URL (base64) ready to hand to jsPDF.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");

    // White background so PNGs with transparency don't come out black
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

/**
 * Rough size of a data URL in bytes (base64 expands by ~33%).
 * Useful for showing students how big their upload is before they submit.
 */
export function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  if (i < 0) return 0;
  const b64 = dataUrl.slice(i + 1);
  return Math.floor((b64.length * 3) / 4);
}
