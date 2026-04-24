import type { PlayerId, Vec3, ShapeKind } from '@/sim/_shared';
import { getShapeDef } from './definitions';
import type { ShapeInstance } from './types';

let compositeCounter = 0;

/** Deterministic composite id. Reset via resetCompositeCounter() in tests. */
export function nextCompositeId(kind: ShapeKind): string {
  compositeCounter += 1;
  return `${kind}#${compositeCounter}`;
}

export function resetCompositeCounter(): void {
  compositeCounter = 0;
}

/**
 * Translate a shape's footprint into absolute world cells given an origin.
 */
export function instantiate(
  kind: ShapeKind,
  origin: Vec3,
  owner: PlayerId
): ShapeInstance {
  const def = getShapeDef(kind);
  const cells: Vec3[] = def.footprint.map((rel) => ({
    x: origin.x + rel.x,
    y: origin.y + rel.y,
    z: origin.z + rel.z,
  }));
  return {
    kind,
    origin,
    owner,
    id: nextCompositeId(kind),
    cellPositions: cells,
  };
}

/** Compute the absolute support-footprint cells for a proposed instance. */
export function absoluteSupportFootprint(
  kind: ShapeKind,
  origin: Vec3
): Vec3[] {
  const def = getShapeDef(kind);
  return def.supportFootprint.map((rel) => ({
    x: origin.x + rel.x,
    y: origin.y + rel.y,
    z: origin.z + rel.z,
  }));
}
