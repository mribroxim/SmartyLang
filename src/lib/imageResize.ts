// Client-side image resizer used before storing in localStorage. Large
// originals would blow past the 5MB localStorage quota and waste bandwidth.

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, JPEG quality
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Resize an image File to a max dimension and return a data URL.
 * Preserves aspect ratio. Falls back to the original if anything goes wrong.
 */
export async function resizeImage(
  file: File,
  opts: ResizeOptions = {},
): Promise<string> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.82,
    outputType = 'image/jpeg',
  } = opts;

  // Read file as data URL first so we can fall back if drawing fails
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  // SVG/GIF stay as-is — don't lose animation/vector data
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL(outputType, quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Rough size of a data URL in bytes (base64 inflates by ~33%) */
export function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(',');
  if (i < 0) return dataUrl.length;
  const b64 = dataUrl.slice(i + 1);
  return Math.floor(b64.length * 0.75);
}
