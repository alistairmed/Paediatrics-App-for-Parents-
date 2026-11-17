import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/** Reads width, height and colour type from a PNG header. Colour type 2 = RGB (no alpha), 6 = RGBA. */
function png(path: string) {
  const b = readFileSync(path);
  expect(b.subarray(1, 4).toString(), path).toBe('PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colourType: b[25] };
}

const RES = 'android/app/src/main/res';
const DENSITIES: Record<string, { legacy: number; foreground: number }> = {
  mdpi: { legacy: 48, foreground: 108 },
  hdpi: { legacy: 72, foreground: 162 },
  xhdpi: { legacy: 96, foreground: 216 },
  xxhdpi: { legacy: 144, foreground: 324 },
  xxxhdpi: { legacy: 192, foreground: 432 },
};

describe('native app icons and splash screens', () => {
  it('iOS App Store icon is 1024x1024 with no transparency', () => {
    const i = png('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
    expect([i.w, i.h, i.colourType]).toEqual([1024, 1024, 2]);
  });

  it('Android launcher icons have the right size at every density, and the foreground keeps its transparency', () => {
    for (const [d, s] of Object.entries(DENSITIES)) {
      for (const name of ['ic_launcher', 'ic_launcher_round']) {
        const i = png(`${RES}/mipmap-${d}/${name}.png`);
        expect([i.w, i.h], `${d} ${name}`).toEqual([s.legacy, s.legacy]);
      }
      const fg = png(`${RES}/mipmap-${d}/ic_launcher_foreground.png`);
      expect([fg.w, fg.h, fg.colourType], `${d} foreground`).toEqual([s.foreground, s.foreground, 6]);
    }
  });

  it('Android adaptive icon background is the brand cream', () => {
    expect(readFileSync(`${RES}/values/ic_launcher_background.xml`, 'utf8')).toContain('#FBF6EE');
  });

  it('splash screens keep their sizes and are not transparent', () => {
    for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
      const i = png(`ios/App/App/Assets.xcassets/Splash.imageset/${f}`);
      expect([i.w, i.h, i.colourType], f).toEqual([2732, 2732, 2]);
    }
    const p = png(`${RES}/drawable-port-xhdpi/splash.png`);
    expect([p.w, p.h, p.colourType]).toEqual([720, 1280, 2]);
  });
});
