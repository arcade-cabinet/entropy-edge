import { z } from 'zod';

/**
 * Content schemas. Every config/raw/*.json is validated against a schema
 * here at compile-time (scripts/compile-content.mjs) AND at runtime on the
 * first import of the compiled module.
 *
 * The schemas intentionally reflect the sim-layer types so the pipeline is
 * a narrow gate, not a second source of truth.
 */

export const progressionSchema = z.object({
  /** Base for the log-curve spine: difficulty = log2(sector + offset). */
  sectorOffset: z.number().int().positive(),
  /** Sector boundaries per difficulty band. */
  bandBreakpoints: z.object({
    band1Max: z.number().int().positive(),
    band2Max: z.number().int().positive(),
    band3Max: z.number().int().positive(),
  }),
});

export const shapeKindSchema = z.enum([
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

export const patternSchema = z.object({
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

export const patternsSchema = z.array(patternSchema).min(1);

export const shapesSchema = z.array(
  z.object({
    kind: shapeKindSchema,
    capacity: z.number().positive(),
    weight: z.number().positive(),
    requiresBrace: z.boolean(),
    cellCount: z.number().int().positive(),
  })
);

export const sessionModesSchema = z.object({
  standard: z.object({ sectors: z.number().int().positive(), description: z.string() }),
  brutalist: z.object({ sectors: z.number().int().positive(), description: z.string() }),
  vertigo: z.object({ sectors: z.number().int().positive(), description: z.string() }),
  daily: z.object({ sectors: z.number().int().positive(), description: z.string() }),
});

export const codenameWordsSchema = z.object({
  adjectives: z.array(z.string().regex(/^[a-z]+$/)).min(4),
  nouns: z.array(z.string().regex(/^[a-z]+$/)).min(4),
});

export const opponentTuningSchema = z.object({
  bands: z.object({
    band1: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
    band2: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
    band3: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
    band4: z.object({ reinforceStress: z.number(), satisfyThreshold: z.number(), climbTier: z.number() }),
  }),
});

export const contentSchema = z.object({
  progression: progressionSchema,
  patterns: patternsSchema,
  shapes: shapesSchema,
  sessionModes: sessionModesSchema,
  codenameWords: codenameWordsSchema,
  opponentTuning: opponentTuningSchema,
});

export type Progression = z.infer<typeof progressionSchema>;
export type Pattern = z.infer<typeof patternSchema>;
export type ShapesManifest = z.infer<typeof shapesSchema>;
export type SessionModes = z.infer<typeof sessionModesSchema>;
export type CodenameWords = z.infer<typeof codenameWordsSchema>;
export type OpponentTuning = z.infer<typeof opponentTuningSchema>;
export type Content = z.infer<typeof contentSchema>;
