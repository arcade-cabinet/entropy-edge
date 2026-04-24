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
import fs from 'node:fs';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function shot(label, viewport) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${label}] console: ${m.text()}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  // Landing page — framer-motion settles in under 500ms.
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outDir}/ee-${label}-landing.png`, fullPage: false });
  // Enter the lattice.
  const cta = page.getByRole('button', { name: /enter the lattice/i });
  if (await cta.count()) {
    await cta.click();
    // JollyPixel + Rapier lazy-load here; 5s covers cold-cache first-paint.
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${outDir}/ee-${label}-play.png`, fullPage: false });
  }
  await page.close();
}

await shot('desktop', { width: 1280, height: 800 });
await shot('mobile', { width: 390, height: 844 });

console.log('ERRORS:', errors.length ? '\n  ' + errors.join('\n  ') : 'none');
console.log(`SHOTS: ${outDir}/ee-*-landing.png, ${outDir}/ee-*-play.png`);
await browser.close();
if (errors.length) process.exit(1);
