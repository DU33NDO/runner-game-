/**
 * Post-build image compression script.
 * Reads dist/index.html, finds all base64 PNG data-URLs, converts them to
 * WebP with sharp, and writes the result back. Run after `vite build`.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '../dist/game.html');

if (!fs.existsSync(htmlPath)) {
  console.error('dist/game.html not found — run `npm run build` first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');
const originalSize = Buffer.byteLength(html, 'utf8');

const regex = /data:image\/png;base64,([A-Za-z0-9+/=]+)/g;
const matches = [...html.matchAll(regex)];

if (matches.length === 0) {
  console.log('No PNG data-URLs found.');
  process.exit(0);
}

console.log(`Found ${matches.length} PNG data-URL(s). Converting to WebP...`);

// Deduplicate — same PNG may appear multiple times
const unique = [...new Map(matches.map(m => [m[1], m])).values()];
let replaced = 0;
let savedBytes = 0;

for (const match of unique) {
  const pngBase64 = match[1];
  const pngBuf = Buffer.from(pngBase64, 'base64');
  try {
    const webpBuf = await sharp(pngBuf).webp({ quality: 82 }).toBuffer();
    const webpBase64 = webpBuf.toString('base64');
    const saving = pngBuf.length - webpBuf.length;
    console.log(`  PNG ${(pngBuf.length / 1024).toFixed(0)}KB → WebP ${(webpBuf.length / 1024).toFixed(0)}KB  (saved ${(saving / 1024).toFixed(0)}KB)`);
    html = html.replaceAll(
      `data:image/png;base64,${pngBase64}`,
      `data:image/webp;base64,${webpBase64}`,
    );
    savedBytes += saving * (html.split(`data:image/webp;base64,${webpBase64}`).length - 1 + 1);
    replaced++;
  } catch (e) {
    console.warn(`  Skipped one image: ${e.message}`);
  }
}

fs.writeFileSync(htmlPath, html, 'utf8');

// Rename to index.html so any hosting platform (Vercel, Netlify, GitHub Pages…)
// serves it correctly by default.
const indexPath = path.join(path.dirname(htmlPath), 'index.html');
if (htmlPath !== indexPath) {
  fs.renameSync(htmlPath, indexPath);
  console.log(`\nRenamed → dist/index.html`);
}

const newSize = Buffer.byteLength(html, 'utf8');
console.log(`\nDone. ${replaced} image(s) converted.`);
console.log(`  Before: ${(originalSize / 1024).toFixed(0)} KB`);
console.log(`  After:  ${(newSize / 1024).toFixed(0)} KB`);
console.log(`  Saved:  ${((originalSize - newSize) / 1024).toFixed(0)} KB`);
