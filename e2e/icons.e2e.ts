import { test, expect } from '@playwright/test';

// Every icon in the web manifest exists, is the right size, and has the cream brand background (not the old indigo heart).
test('Web app icons are the new Paeds Pouch logo on cream', async ({ page, request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  const srcs: string[] = [...manifest.icons.map((i: { src: string }) => i.src), '/icons/apple-touch-icon.png', '/icons/favicon-32.png'];
  await page.goto('/');
  for (const src of srcs) {
    const info = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
      return { w: img.naturalWidth, h: img.naturalHeight, r, g, b };
    }, src);
    const declared = manifest.icons.find((i: { src: string }) => i.src === src)?.sizes;
    if (declared) expect(`${info.w}x${info.h}`, src).toBe(declared);
    expect(info.w, src).toBe(info.h);
    // Cream is about (251, 246, 238); the old icon was indigo (79, 70, 229).
    expect([info.r, info.g, info.b], src).toEqual([251, 246, 238]);
  }
});
