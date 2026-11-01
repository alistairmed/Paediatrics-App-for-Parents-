/**
 * Copies the brand pack into place once brand/ is added to the repo:
 *
 *   node scripts/install-brand-assets.mjs
 *
 *   brand/icons/parent-<size>.png          -> public/icons/icon-<size>.png
 *   brand/icons/parent-maskable-<size>.png -> public/icons/icon-maskable-<size>.png
 *   brand/icons/parent-32.png, parent-16.png -> public/icons/favicon-32.png, favicon-16.png
 *   brand/icons/parent-180.png             -> public/icons/apple-touch-icon.png
 *   brand/svg/logo-parent.svg              -> public/brand/logo.svg (lock screen and setup)
 *   brand/svg/icon-parent.svg              -> assets/icon.svg (for npx @capacitor/assets generate)
 *
 * Files missing from brand/ are reported and skipped; nothing else is changed.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const copies = [];
const iconDir = 'brand/icons';
if (existsSync(iconDir)) {
  for (const file of readdirSync(iconDir)) {
    let m;
    if ((m = /^parent-maskable-(\d+)\.png$/.exec(file))) copies.push([join(iconDir, file), `public/icons/icon-maskable-${m[1]}.png`]);
    else if (file === 'parent-180.png') copies.push([join(iconDir, file), 'public/icons/apple-touch-icon.png']);
    else if ((m = /^parent-(16|32)\.png$/.exec(file))) copies.push([join(iconDir, file), `public/icons/favicon-${m[1]}.png`]);
    else if ((m = /^parent-(\d+)\.png$/.exec(file))) copies.push([join(iconDir, file), `public/icons/icon-${m[1]}.png`]);
  }
} else {
  console.warn(`Missing ${iconDir}/`);
}
copies.push(['brand/svg/logo-parent.svg', 'public/brand/logo.svg'], ['brand/svg/icon-parent.svg', 'assets/icon.svg']);

let copied = 0;
for (const [from, to] of copies) {
  if (!existsSync(from)) { console.warn(`Skipped (not found): ${from}`); continue; }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`${from} -> ${to}`);
  copied++;
}
console.log(`${copied} file(s) copied. Rebuild the app, then run npx @capacitor/assets generate for the native icons.`);
