/**
 * One-time script to generate PWA icons.
 * Run with: node scripts/generate-icons.mjs
 * Requires @napi-rs/canvas (devDependency).
 */
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');

mkdirSync(outDir, { recursive: true });

/**
 * Draws the icon: green background + white "FF" text.
 * @param {number} size - Canvas size in pixels
 * @param {boolean} maskable - If true, shrinks content to safe zone
 * @returns {Buffer} PNG buffer
 */
function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, size, size);

  // Text sizing — maskable icons keep content in 80% safe zone
  const scale = maskable ? 0.6 : 0.75;
  const fontSize = Math.round(size * scale * 0.5);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FF', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
];

for (const { name, size, maskable } of icons) {
  const buf = generateIcon(size, maskable);
  writeFileSync(join(outDir, name), buf);
  console.log(`Generated public/icons/${name}`);
}
