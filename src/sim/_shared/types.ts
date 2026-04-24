/**
 * Core sim types. No engine, no DOM, no React imports allowed from here or
 * anywhere downstream in src/sim/**.
 */

export type PlayerId = 'you' | 'rival';

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type CellId = string;

export function cellId(x: number, y: number, z: number): CellId {
  return `${x},${y},${z}`;
}

export function parseCellId(id: CellId): Vec3 {
  const parts = id.split(',');
  if (parts.length !== 3) {
    throw new Error(`cellId: malformed id "${id}"`);
  }
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  const z = Number(parts[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    throw new Error(`cellId: non-finite component in "${id}"`);
  }
  return { x, y, z };
}

export type ShapeKind =
  | 'cube'
  | 'plate2x2'
  | 'plate3x3'
  | 'plate4x4'
  | 'wedge'
  | 'pyramid'
  | 'ziggurat'
  | 'lintel'
  | 'beam'
  | 'arch'
  | 'trussBridge'
  | 'flyingButtress'
  | 'diagonalBrace'
  | 'kBrace'
  | 'crossBrace'
  | 'corbel';

export interface Cell {
  readonly id: CellId;
  readonly pos: Vec3;
  readonly owner: PlayerId;
  /** Which composite (if any) this cell belongs to. Null for plain 1×1. */
  readonly compositeId: string | null;
  /** Monument flag — set at claim time, persists across sectors. */
  readonly monument: boolean;
}

export interface Composite {
  readonly id: string;
  readonly kind: ShapeKind;
  readonly owner: PlayerId;
  readonly cellIds: readonly CellId[];
  /** Origin cell used for drawing + stability lookup. */
  readonly origin: Vec3;
  /** Composite-level load capacity (computed from kind + metrics). */
  readonly capacity: number;
  /** Composite-level weight (sum of component weights). */
  readonly weight: number;
}
