#!/usr/bin/env node
/**
 * Generate the entropy-edge tileset PNG programmatically.
 *
 * 3×3 grid of 32px tiles. Layout:
 *   col 0, row 0: signal-orange solid face
 *   col 1, row 0: cyan-beacon top/edge face
 *   col 2, row 0: stress-red pulse face
 *   col 0, row 1: violet-rival solid face
 *   col 1, row 1: violet-rival edge face
 *   col 2, row 1: mint-monument face
 *   col 0, row 2: cyan-hologram alpha face
 *   col 1, row 2: amber-brace-needed face
 *   col 2, row 2: (reserved)
 *
 * Writes to public/tileset/entropy-edge.png.
 */

import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '..', 'public', 'tileset');
const outFile = path.join(outDir, 'entropy-edge.png');

const TILE = 32;
const COLS = 3;
const ROWS = 3;
const W = TILE * COLS;
const H = TILE * ROWS;

function hexToRgb(hex) {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

const PALETTE = {
  signal: hexToRgb('#ff6b1a'),
  signalEdge: hexToRgb('#ffaa5a'),
  beacon: hexToRgb('#21d4ff'),
  beaconEdge: hexToRgb('#5aeaff'),
  stress: hexToRgb('#ff375f'),
  rival: hexToRgb('#7d5cff'),
  rivalEdge: hexToRgb('#a68dff'),
  monument: hexToRgb('#2ee5b8'),
  monumentEdge: hexToRgb('#6df5cf'),
  hologram: hexToRgb('#21d4ff'),
  amber: hexToRgb('#ffae00'),
  graphite: hexToRgb('#0f1115'),
};

function drawTile(png, tileCol, tileRow, fillRgb, edgeRgb, alpha = 255) {
  const x0 = tileCol * TILE;
  const y0 = tileRow * TILE;
  for (let dy = 0; dy < TILE; dy++) {
    for (let dx = 0; dx < TILE; dx++) {
      const x = x0 + dx;
      const y = y0 + dy;
      const idx = (y * W + x) * 4;
      const onEdge = dx === 0 || dy === 0 || dx === TILE - 1 || dy === TILE - 1;
      const onInset = dx === 1 || dy === 1 || dx === TILE - 2 || dy === TILE - 2;
      const rgb = onEdge ? edgeRgb : onInset ? edgeRgb : fillRgb;
      png.data[idx] = rgb[0];
      png.data[idx + 1] = rgb[1];
      png.data[idx + 2] = rgb[2];
      png.data[idx + 3] = alpha;
    }
  }
}

mkdirSync(outDir, { recursive: true });

const png = new PNG({ width: W, height: H });

// Fill with transparent graphite
for (let i = 0; i < png.data.length; i += 4) {
  png.data[i] = 0;
  png.data[i + 1] = 0;
  png.data[i + 2] = 0;
  png.data[i + 3] = 0;
}

drawTile(png, 0, 0, PALETTE.signal, PALETTE.signalEdge);
drawTile(png, 1, 0, PALETTE.beacon, PALETTE.beaconEdge);
drawTile(png, 2, 0, PALETTE.stress, PALETTE.signal);
drawTile(png, 0, 1, PALETTE.rival, PALETTE.rivalEdge);
drawTile(png, 1, 1, PALETTE.rival, PALETTE.beaconEdge);
drawTile(png, 2, 1, PALETTE.monument, PALETTE.monumentEdge);
drawTile(png, 0, 2, PALETTE.hologram, PALETTE.beaconEdge, 140);
drawTile(png, 1, 2, PALETTE.amber, PALETTE.signalEdge);

writeFileSync(outFile, PNG.sync.write(png));
process.stdout.write(`tileset → ${path.relative(process.cwd(), outFile)}\n`);
