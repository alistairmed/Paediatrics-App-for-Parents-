/**
 * Reads an image file as a JPEG data URL, scaled so its longest side is at
 * most maxSize pixels. Phone photos are several MB, and browser storage
 * holds about 5 MB in total, so photos are shrunk before they're saved.
 * Falls back to the original file if the browser can't decode it.
 */
export async function readImageAsCompressedDataUrl(file: File, maxSize = 1280, quality = 0.7): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = original;
    });

    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    return compressed.length < original.length ? compressed : original;
  } catch {
    return original;
  }
}
