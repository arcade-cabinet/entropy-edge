import type { ShapeKind } from '@/sim/_shared';

/**
 * A sector objective — what both builders are racing to satisfy.
 */
export interface ConnectivityThreshold {
  readonly tier: number;
  readonly minConnected: number;
}

export interface SectorObjective {
  readonly sector: number;
  readonly difficultyBand: 1 | 2 | 3 | 4;
  readonly patternName: string;
  readonly tierTarget: number;
  readonly connectivity: readonly ConnectivityThreshold[];
  readonly blockBudgetPerRound: number;
  readonly maxRounds: number;
  readonly shapePalette: readonly ShapeKind[];
  readonly telegraph: string;
}

export interface Pattern {
  readonly name: string;
  readonly band: 1 | 2 | 3 | 4;
  readonly tierTarget: [number, number];
  readonly connectivityTiers: number;
  readonly connectivityWidth: [number, number];
  readonly platforms: number;
  readonly platformSize: 2 | 3 | 4 | null;
  readonly blockBudget: [number, number];
  readonly maxRounds: [number, number];
  readonly telegraph: string;
}

export const PATTERN_POOL: readonly Pattern[] = [
  {
    name: 'straight-ascent',
    band: 1,
    tierTarget: [3, 4],
    connectivityTiers: 0,
    connectivityWidth: [1, 1],
    platforms: 0,
    platformSize: null,
    blockBudget: [4, 5],
    maxRounds: [6, 8],
    telegraph: 'Reach the target tier.',
  },
  {
    name: 'first-platform',
    band: 1,
    tierTarget: [4, 5],
    connectivityTiers: 1,
    connectivityWidth: [3, 4],
    platforms: 1,
    platformSize: 2,
    blockBudget: [5, 6],
    maxRounds: [7, 9],
    telegraph: 'Platform required. Hold a cluster at Tier 2.',
  },
  {
    name: 'twin-peaks',
    band: 2,
    tierTarget: [5, 7],
    connectivityTiers: 1,
    connectivityWidth: [4, 5],
    platforms: 2,
    platformSize: 2,
    blockBudget: [6, 7],
    maxRounds: [8, 10],
    telegraph: 'Twin platforms. Link with a lintel.',
  },
  {
    name: 'pyramid-base',
    band: 2,
    tierTarget: [5, 7],
    connectivityTiers: 1,
    connectivityWidth: [6, 9],
    platforms: 1,
    platformSize: 3,
    blockBudget: [6, 8],
    maxRounds: [9, 11],
    telegraph: 'Pyramid at the base. Reach the spire.',
  },
  {
    name: 'stepping-stones',
    band: 3,
    tierTarget: [8, 10],
    connectivityTiers: 2,
    connectivityWidth: [4, 6],
    platforms: 3,
    platformSize: 3,
    blockBudget: [7, 9],
    maxRounds: [11, 13],
    telegraph: 'Stepping-stone platforms. Brace between them.',
  },
  {
    name: 'cathedral',
    band: 3,
    tierTarget: [9, 11],
    connectivityTiers: 2,
    connectivityWidth: [6, 8],
    platforms: 2,
    platformSize: 3,
    blockBudget: [7, 9],
    maxRounds: [11, 13],
    telegraph: 'Wide base, mid-tier truss, spire above.',
  },
  {
    name: 'skyline',
    band: 4,
    tierTarget: [12, 15],
    connectivityTiers: 3,
    connectivityWidth: [8, 10],
    platforms: 3,
    platformSize: 4,
    blockBudget: [8, 10],
    maxRounds: [13, 15],
    telegraph: 'Wide-base frame. Trusses required.',
  },
  {
    name: 'flying-buttress',
    band: 4,
    tierTarget: [12, 15],
    connectivityTiers: 2,
    connectivityWidth: [6, 8],
    platforms: 2,
    platformSize: 4,
    blockBudget: [8, 10],
    maxRounds: [13, 15],
    telegraph: 'Tall spire supported by buttresses.',
  },
];

export const BAND_SHAPE_PALETTE: Record<1 | 2 | 3 | 4, readonly ShapeKind[]> = {
  1: ['cube', 'plate2x2', 'wedge', 'lintel', 'diagonalBrace'],
  2: ['cube', 'plate2x2', 'plate3x3', 'wedge', 'pyramid', 'lintel', 'beam', 'arch', 'diagonalBrace'],
  3: [
    'cube',
    'plate2x2',
    'plate3x3',
    'wedge',
    'pyramid',
    'lintel',
    'beam',
    'arch',
    'trussBridge',
    'diagonalBrace',
    'corbel',
  ],
  4: [
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
  ],
};
