#!/usr/bin/env node
/**
 * compile-content.mjs
 *
 * Reads config/raw/*.json, validates each file against its Zod schema, and
 * emits config/compiled/content.ts (gitignored) as a typed const module.
 *
 * Failure aborts with exit code 1 — a bad content file fails the predev /
 * prebuild / pretypecheck / pretest hook before any TS compilation runs.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const rawDir = path.join(rootDir, 'config', 'raw');
const outDir = path.join(rootDir, 'config', 'compiled');
const outFile = path.join(outDir, 'content.ts');

function readJson(name) {
  const p = path.join(rawDir, `${name}.json`);
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (err) {
    process.stderr.write(`[compile-content] failed to read ${p}: ${err.message}\n`);
    process.exit(1);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Schemas — mirrored from src/data/schemas.ts. Kept in sync manually; the
// *.test.ts in src/data validates that the two match.
// ──────────────────────────────────────────────────────────────────────────

const progressionSchema = z.object({
  sectorOffset: z.number().int().positive(),
  bandBreakpoints: z.object({
    band1Max: z.number().int().positive(),
    band2Max: z.number().int().positive(),
    band3Max: z.number().int().positive(),
  }),
});

const shapeKind = z.enum([
  'cube',
  'plate2x2',
  'plate3x3',
  'plate4x4',
  'wedge',
  'pyramid',
  'ziggurat',
  'lintel',
  'beam',
  'arch',
  'trussBridge',
  'flyingButtress',
  'diagonalBrace',
  'kBrace',
  'crossBrace',
  'corbel',
]);

const patternSchema = z.object({
  name: z.string().min(1),
  band: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  tierTarget: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  connectivityTiers: z.number().int().nonnegative(),
  connectivityWidth: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  platforms: z.number().int().nonnegative(),
  platformSize: z.union([z.literal(2), z.literal(3), z.literal(4), z.null()]),
  blockBudget: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  maxRounds: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  telegraph: z.string().min(1),
});

const patternsSchema = z.array(patternSchema).min(1);

const shapesSchema = z.array(
  z.object({
    kind: shapeKind,
    capacity: z.number().positive(),
    weight: z.number().positive(),
    requiresBrace: z.boolean(),
    cellCount: z.number().int().positive(),
  })
);

const sessionModesSchema = z.object({
  standard: z.object({ sectors: z.number().int().positive(), description: z.string() }),
  brutalist: z.object({ sectors: z.number().int().positive(), description: z.string() }),
  vertigo: z.object({ sectors: z.number().int().positive(), description: z.string() }),
  daily: z.object({ sectors: z.number().int().positive(), description: z.string() }),
});

const codenameWordsSchema = z.object({
  adjectives: z.array(z.string().regex(/^[a-z]+$/)).min(4),
  nouns: z.array(z.string().regex(/^[a-z]+$/)).min(4),
});

const opponentTuningSchema = z.object({
  bands: z.object({
    band1: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
    band2: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
    band3: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
    band4: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
  }),
});

function validate(schema, name, raw) {
  const result = schema.safeParse(raw);
  if (!result.success) {
    process.stderr.write(`[compile-content] ${name}.json failed validation:\n`);
    for (const issue of result.error.issues) {
      process.stderr.write(`  • ${issue.path.join('.')}: ${issue.message}\n`);
    }
    process.exit(1);
  }
  return result.data;
}

// ──────────────────────────────────────────────────────────────────────────
// Pipeline
// ──────────────────────────────────────────────────────────────────────────

const progression = validate(progressionSchema, 'progression', readJson('progression'));
const patterns = validate(patternsSchema, 'patterns', readJson('patterns'));
const shapes = validate(shapesSchema, 'shapes', readJson('shapes'));
const sessionModes = validate(sessionModesSchema, 'session-modes', readJson('session-modes'));
const codenameWords = validate(codenameWordsSchema, 'codename-words', readJson('codename-words'));
const opponentTuning = validate(opponentTuningSchema, 'opponent-tuning', readJson('opponent-tuning'));

const content = {
  progression,
  patterns,
  shapes,
  sessionModes,
  codenameWords,
  opponentTuning,
};

mkdirSync(outDir, { recursive: true });

const banner = `// Auto-generated by scripts/compile-content.mjs — do not edit.\n`;
const body = `import type { Content } from '@/data/schemas';\n\nexport const content: Content = ${JSON.stringify(content, null, 2)} as const;\n\nexport type { Content } from '@/data/schemas';\n`;

writeFileSync(outFile, banner + body, 'utf8');
process.stdout.write(`compile-content → ${path.relative(rootDir, outFile)} (${patterns.length} patterns, ${shapes.length} shapes)\n`);
