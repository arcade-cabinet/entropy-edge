import type { ShapeKind, Vec3 } from '@/sim/_shared';
import type { ShapeDef } from './types';

/**
 * Shape grammar definitions. Each shape is expressed as cells relative to
 * its origin (0,0,0), plus the support footprint (cells that MUST be solid
 * directly beneath the shape), plus structural metrics (capacity, weight,
 * brace requirement).
 *
 * Conventions:
 *   +y = up, +x = east, +z = south.
 *   Origin is the shape's south-west-bottom corner unless otherwise noted.
 *   Ground plane is y = 0; anything at y = 0 needs no support footprint.
 */

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

function plateFootprint(size: 2 | 3 | 4): Vec3[] {
  const out: Vec3[] = [];
  for (let dx = 0; dx < size; dx++) {
    for (let dz = 0; dz < size; dz++) {
      out.push(v(dx, 0, dz));
    }
  }
  return out;
}

function supportBeneath(cells: readonly Vec3[]): Vec3[] {
  return cells
    .filter((c) => c.y === Math.min(...cells.map((k) => k.y)))
    .map((c) => v(c.x, c.y - 1, c.z));
}

export const CUBE: ShapeDef = {
  kind: 'cube',
  footprint: [v(0, 0, 0)],
  supportFootprint: [v(0, -1, 0)],
  metrics: { capacity: 1, weight: 1, requiresBrace: false },
};

export const PLATE_2X2: ShapeDef = {
  kind: 'plate2x2',
  footprint: plateFootprint(2),
  supportFootprint: supportBeneath(plateFootprint(2)),
  metrics: { capacity: 4, weight: 4, requiresBrace: false },
};

export const PLATE_3X3: ShapeDef = {
  kind: 'plate3x3',
  footprint: plateFootprint(3),
  supportFootprint: supportBeneath(plateFootprint(3)),
  metrics: { capacity: 9, weight: 9, requiresBrace: false },
};

export const PLATE_4X4: ShapeDef = {
  kind: 'plate4x4',
  footprint: plateFootprint(4),
  supportFootprint: supportBeneath(plateFootprint(4)),
  metrics: { capacity: 16, weight: 16, requiresBrace: false },
};

/** Wedge: 2×2 plate at y=0, 1 cell centered on top at y=1 (north-east corner logic: center of a 2×2 is between cells, so we use the south-west cell at (0,1,0)). */
export const WEDGE: ShapeDef = (() => {
  const base = plateFootprint(2);
  const cap = v(0, 1, 0);
  const footprint = [...base, cap];
  return {
    kind: 'wedge',
    footprint,
    supportFootprint: supportBeneath(base),
    metrics: { capacity: 6, weight: 5, requiresBrace: false },
  };
})();

/** Pyramid: 3×3 base, 2×2 middle, 1 cap. Stepped inward. */
export const PYRAMID: ShapeDef = (() => {
  const base = plateFootprint(3);
  const middle = [v(0, 1, 0), v(1, 1, 0), v(0, 1, 1), v(1, 1, 1)];
  const cap = [v(0, 2, 0)];
  const footprint = [...base, ...middle, ...cap];
  return {
    kind: 'pyramid',
    footprint,
    supportFootprint: supportBeneath(base),
    metrics: { capacity: 20, weight: 14, requiresBrace: false },
  };
})();

export const ZIGGURAT: ShapeDef = (() => {
  const base = plateFootprint(4);
  const middle = plateFootprint(3).map((c) => v(c.x, 1, c.z));
  const upper = plateFootprint(2).map((c) => v(c.x + 1, 2, c.z + 1));
  const cap = [v(1, 3, 1)];
  const footprint = [...base, ...middle, ...upper, ...cap];
  return {
    kind: 'ziggurat',
    footprint,
    supportFootprint: supportBeneath(base),
    metrics: { capacity: 40, weight: 30, requiresBrace: false },
  };
})();

/** Lintel: 2 columns (already in grid), 1 spanning block atop them with a
 * 1-cell gap between. Origin is at the span-block's position. The column
 * cells themselves are NOT part of the composite footprint — they are
 * required support. */
export const LINTEL: ShapeDef = {
  kind: 'lintel',
  footprint: [v(0, 0, 0)],
  supportFootprint: [v(-1, -1, 0), v(1, -1, 0)],
  metrics: { capacity: 3, weight: 1, requiresBrace: false },
};

/** Beam: 3 cells in a line forming a span block, supported by columns at each end. */
export const BEAM: ShapeDef = {
  kind: 'beam',
  footprint: [v(0, 0, 0), v(1, 0, 0), v(2, 0, 0)],
  supportFootprint: [v(-1, -1, 0), v(3, -1, 0)],
  metrics: { capacity: 4, weight: 3, requiresBrace: false },
};

/** Arch: 5-cell span — 2 ramp corners + apex cell. Supports come from the
 * abutments of each column. */
export const ARCH: ShapeDef = {
  kind: 'arch',
  footprint: [v(0, 0, 0), v(1, 1, 0), v(2, 1, 0), v(3, 1, 0), v(4, 0, 0)],
  supportFootprint: [v(-1, -1, 0), v(5, -1, 0)],
  metrics: { capacity: 8, weight: 5, requiresBrace: false },
};

/** Truss bridge: top + bottom chord + diagonal web, 8-cell span. */
export const TRUSS_BRIDGE: ShapeDef = (() => {
  const bottom: Vec3[] = [];
  for (let x = 0; x < 8; x++) bottom.push(v(x, 0, 0));
  const top: Vec3[] = [];
  for (let x = 1; x < 7; x++) top.push(v(x, 2, 0));
  const webs: Vec3[] = [
    v(0, 1, 0),
    v(2, 1, 0),
    v(4, 1, 0),
    v(6, 1, 0),
    v(7, 1, 0),
  ];
  return {
    kind: 'trussBridge',
    footprint: [...bottom, ...top, ...webs],
    supportFootprint: [v(-1, -1, 0), v(8, -1, 0)],
    metrics: { capacity: 14, weight: 19, requiresBrace: false },
  };
})();

/** Flying buttress: column + diagonal member to ground anchor at +x, -z. */
export const FLYING_BUTTRESS: ShapeDef = {
  kind: 'flyingButtress',
  footprint: [v(0, 0, 0), v(1, 1, 0), v(2, 2, 0), v(3, 3, 0)],
  supportFootprint: [v(0, -1, 0)],
  metrics: { capacity: 4, weight: 4, requiresBrace: false },
};

/** Diagonal brace: 2 cells stairstep from column base to cantilever tip. */
export const DIAGONAL_BRACE: ShapeDef = {
  kind: 'diagonalBrace',
  footprint: [v(0, 0, 0), v(1, 1, 0)],
  supportFootprint: [v(0, -1, 0)],
  metrics: { capacity: 2, weight: 2, requiresBrace: false },
};

/** K-brace: 2 diagonals meeting at mid-column. */
export const K_BRACE: ShapeDef = {
  kind: 'kBrace',
  footprint: [v(0, 0, 0), v(1, 1, 0), v(1, 2, 0), v(0, 3, 0)],
  supportFootprint: [v(0, -1, 0)],
  metrics: { capacity: 3, weight: 4, requiresBrace: false },
};

/** Cross-brace: 2 diagonals X'd between two columns, 3 cells apart. */
export const CROSS_BRACE: ShapeDef = {
  kind: 'crossBrace',
  footprint: [v(0, 0, 0), v(1, 1, 0), v(2, 0, 0), v(1, 1, 0)].filter(
    (vec, idx, all) =>
      all.findIndex((u) => u.x === vec.x && u.y === vec.y && u.z === vec.z) === idx
  ),
  supportFootprint: [v(0, -1, 0), v(2, -1, 0)],
  metrics: { capacity: 2, weight: 3, requiresBrace: false },
};

/** Corbel: stepped blocks protruding from column — self-bracing shelf. */
export const CORBEL: ShapeDef = {
  kind: 'corbel',
  footprint: [v(0, 0, 0), v(1, 0, 0), v(2, 0, 0)],
  supportFootprint: [v(0, -1, 0)],
  metrics: { capacity: 3, weight: 3, requiresBrace: false },
};

export const SHAPE_DEFS: Record<ShapeKind, ShapeDef> = {
  cube: CUBE,
  plate2x2: PLATE_2X2,
  plate3x3: PLATE_3X3,
  plate4x4: PLATE_4X4,
  wedge: WEDGE,
  pyramid: PYRAMID,
  ziggurat: ZIGGURAT,
  lintel: LINTEL,
  beam: BEAM,
  arch: ARCH,
  trussBridge: TRUSS_BRIDGE,
  flyingButtress: FLYING_BUTTRESS,
  diagonalBrace: DIAGONAL_BRACE,
  kBrace: K_BRACE,
  crossBrace: CROSS_BRACE,
  corbel: CORBEL,
};

export function getShapeDef(kind: ShapeKind): ShapeDef {
  return SHAPE_DEFS[kind];
}
