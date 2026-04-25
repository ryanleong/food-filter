/**
 * Client-side image compression utility.
 * Uses the Canvas API — do NOT import this on the server.
 */

/**
 * Compresses and resizes a menu image before sending to the API.
 * Output is always JPEG regardless of input format.
 *
 * @param file     The image File selected by the user
 * @param maxSizeKB Target maximum size in kilobytes (default: 1024 = 1 MB)
 * @returns        A JPEG Blob at or below maxSizeKB, or as small as possible
 */
export async function compressImage(file: File, maxSizeKB = 1024): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new Error('compressImage must be called in a browser context');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const img = await loadImage(file);
  return compressToTarget(img, maxSizeKB);
}

/** Decodes a File into an HTMLImageElement. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Draws the image to a canvas at the given dimensions and encodes as JPEG.
 * Shrinks by 0.9× per iteration until the output is under maxSizeKB
 * or the shorter side falls below 100 px.
 */
async function compressToTarget(img: HTMLImageElement, maxSizeKB: number): Promise<Blob> {
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  const maxBytes = maxSizeKB * 1024;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const blob = await encodeAsJpeg(img, width, height);

    if (blob.size <= maxBytes) return blob;

    // Stop shrinking when the shorter side reaches the minimum floor
    const shorter = Math.min(width, height);
    if (shorter <= 100) return blob;

    width = Math.round(width * 0.9);
    height = Math.round(height * 0.9);
  }
}

/** Draws to a canvas and encodes as JPEG at quality 0.85. */
function encodeAsJpeg(img: HTMLImageElement, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D canvas context'));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      0.85
    );
  });
}
