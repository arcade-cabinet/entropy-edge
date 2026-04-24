import type { PlayerId, ShapeKind, Vec3 } from '@/sim/_shared';
import type { Grid } from '@/sim/grid';
import { absoluteSupportFootprint, getShapeDef, instantiate } from '@/sim/shapes';

/**
 * Placement validity.
 *   green — legal and introduces no stress
 *   amber — legal but creates stress somewhere (player is warned)
 *   red   — illegal (out of bounds, collision, missing support)
 */

export type PlacementValidity = 'green' | 'amber' | 'red';

export interface PlacementRequest {
  readonly kind: ShapeKind;
  readonly origin: Vec3;
  readonly owner: PlayerId;
}

export interface PlacementCheck {
  readonly validity: PlacementValidity;
  readonly reason?: string;
  readonly cellsToPlace: readonly Vec3[];
}

export function checkPlacement(grid: Grid, req: PlacementRequest): PlacementCheck {
  const def = getShapeDef(req.kind);
  const absolute: Vec3[] = def.footprint.map((rel) => ({
    x: req.origin.x + rel.x,
    y: req.origin.y + rel.y,
    z: req.origin.z + rel.z,
  }));

  for (const cell of absolute) {
    if (!grid.inBounds(cell)) {
      return { validity: 'red', reason: 'out of bounds', cellsToPlace: absolute };
    }
    if (grid.has(cell)) {
      return { validity: 'red', reason: 'cell occupied', cellsToPlace: absolute };
    }
  }

  const needed = absoluteSupportFootprint(req.kind, req.origin);
  for (const s of needed) {
    if (s.y < 0) continue; // ground is infinite support
    if (!grid.has(s)) {
      return {
        validity: 'red',
        reason: 'missing support',
        cellsToPlace: absolute,
      };
    }
  }

  // For a proper stress check we would place-then-solve-then-revert. For now
  // we flag amber if the shape is a cantilever-style piece (requiresBrace
  // metadata) so the caller can request a brace. Fully accurate amber
  // calculation lands with duel-phase integration.
  if (def.metrics.requiresBrace) {
    return { validity: 'amber', cellsToPlace: absolute };
  }

  return { validity: 'green', cellsToPlace: absolute };
}

/** Commit a placement to the grid. Assumes checkPlacement returned non-red. */
export function commitPlacement(
  grid: Grid,
  req: PlacementRequest
): { placedCellIds: readonly string[]; compositeId: string | null } {
  const instance = instantiate(req.kind, req.origin, req.owner);
  const placedCellIds: string[] = [];
  for (const pos of instance.cellPositions) {
    const cell = grid.place({ pos, owner: req.owner, compositeId: instance.id });
    placedCellIds.push(cell.id);
  }
  // Only mark as a composite if more than 1 cell; 1×1 cubes stay loose.
  if (instance.cellPositions.length > 1) {
    const def = getShapeDef(req.kind);
    grid.registerComposite({
      id: instance.id,
      kind: req.kind,
      owner: req.owner,
      cellIds: placedCellIds,
      origin: req.origin,
      capacity: def.metrics.capacity,
      weight: def.metrics.weight,
    });
    return { placedCellIds, compositeId: instance.id };
  }
  return { placedCellIds, compositeId: null };
}
