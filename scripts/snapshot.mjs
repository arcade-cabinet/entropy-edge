#!/usr/bin/env node
/**
 * snapshot.mjs — capture a desktop + mobile screenshot of the running dev
 * server and report any console / pageerror events.
 *
 * Start dev server separately (pnpm dev) and then run `node scripts/snapshot.mjs`.
 * Defaults to http://127.0.0.1:5173 (the vite default). Override with URL env.
 */

import { chromium } from 'playwright';

const url = process.env.URL || 'http://127.0.0.1:5173/';
const outDir = process.env.SNAPSHOT_DIR || '/tmp';
const browser = await chromium.launch();
const errors = [];

async function shot(label, viewport) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${label}] console: ${m.text()}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  // JollyPixel shows a Lit-based loading UI first, then hands off to the
  // scene. 5s gives the tileset fetch + first chunk mesh build enough time.
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${outDir}/ee-${label}.png`, fullPage: false });
  await page.close();
}

await shot('desktop', { width: 1280, height: 800 });
await shot('mobile', { width: 390, height: 844 });

console.log('ERRORS:', errors.length ? '\n  ' + errors.join('\n  ') : 'none');
console.log(`SHOTS: ${outDir}/ee-desktop.png, ${outDir}/ee-mobile.png`);
await browser.close();
if (errors.length) process.exit(1);
