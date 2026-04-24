import { cellId, type CellId, type Vec3 } from '@/sim/_shared';
import type { Grid } from '@/sim/grid';

/**
 * Stability solver.
 *
 * Model: each 1×1 cell carries a weight of 1 plus all weight on top of it,
 * transitively. A cell's support capacity is the number of solid cells
 * directly beneath it PLUS adjacent lateral supports within a cantilever
 * tolerance of 1 cell. Ground (y=0) always counts as solid support with
 * infinite capacity.
 *
 * A cell is STRESSED if load > supportCapacity. Stress propagates downward
 * (everything the stressed cell was carrying risks falling with it) and
 * horizontally along cantilever tolerance chains.
 */

const CANTILEVER_TOLERANCE = 1;
const CAPACITY_PER_COLUMN = 3;

export interface StabilityState {
  /** cellId → load (weight + weight above). */
  readonly loads: ReadonlyMap<CellId, number>;
  /** cellId → capacity. Infinity for ground-supported foundations. */
  readonly capacities: ReadonlyMap<CellId, number>;
  /** Cells whose load > capacity. */
  readonly stressed: ReadonlySet<CellId>;
  /** Cells that will collapse if stress resolves (stressed + dependents). */
  readonly collapsing: ReadonlySet<CellId>;
}

export function solve(grid: Grid): StabilityState {
  const loads = new Map<CellId, number>();
  const capacities = new Map<CellId, number>();

  const cells = Array.from(grid.values());
  const sortedDown = cells.slice().sort((a, b) => b.pos.y - a.pos.y);

  // Compute loads top-down: a cell's load = its own weight + loads dropped on it.
  for (const cell of sortedDown) {
    const self = 1;
    const existing = loads.get(cell.id) ?? 0;
    const total = existing + self;
    loads.set(cell.id, total);

    // Drop load onto supports directly beneath + within cantilever tolerance.
    const supports = resolveSupports(grid, cell.pos);
    if (supports.length === 0) continue;
    const share = total / supports.length;
    for (const sid of supports) {
      loads.set(sid, (loads.get(sid) ?? 0) + share);
    }
  }

  // Compute capacities per cell: infinity on ground, else CAPACITY_PER_COLUMN * supports-below.
  for (const cell of cells) {
    if (cell.pos.y === 0) {
      capacities.set(cell.id, Number.POSITIVE_INFINITY);
      continue;
    }
    const supports = resolveSupports(grid, cell.pos);
    capacities.set(cell.id, supports.length * CAPACITY_PER_COLUMN);
  }

  const stressed = new Set<CellId>();
  for (const cell of cells) {
    const load = loads.get(cell.id) ?? 0;
    const cap = capacities.get(cell.id) ?? 0;
    if (cap < load) stressed.add(cell.id);
  }

  const collapsing = new Set<CellId>();
  for (const id of stressed) collapsing.add(id);
  // Everything a stressed cell supports is at risk.
  for (const cell of cells) {
    const supports = resolveSupports(grid, cell.pos);
    const relying = supports.every((s) => stressed.has(s));
    if (relying && supports.length > 0) collapsing.add(cell.id);
  }

  return { loads, capacities, stressed, collapsing };
}

/**
 * Cells that supply support to a given cell. A cell is "supported" if:
 *   - there is a cell directly beneath it, OR
 *   - there is a cell 1 below AND adjacent to it within cantilever tolerance
 *     whose own support path traces to a non-cantilevered base.
 *
 * This implementation is intentionally conservative: we only count direct
 * below + immediate neighbors-below within tolerance. A richer version can
 * trace support chains.
 */
function resolveSupports(grid: Grid, pos: Vec3): CellId[] {
  const out: CellId[] = [];
  const below: Vec3 = { x: pos.x, y: pos.y - 1, z: pos.z };
  if (grid.has(below)) out.push(cellId(below.x, below.y, below.z));
  if (pos.y === 1 && out.length > 0) return out; // direct support from ground; done
  for (let dx = -CANTILEVER_TOLERANCE; dx <= CANTILEVER_TOLERANCE; dx++) {
    for (let dz = -CANTILEVER_TOLERANCE; dz <= CANTILEVER_TOLERANCE; dz++) {
      if (dx === 0 && dz === 0) continue;
      const n: Vec3 = { x: pos.x + dx, y: pos.y - 1, z: pos.z + dz };
      if (grid.has(n)) out.push(cellId(n.x, n.y, n.z));
    }
  }
  return out;
}

/** Run `collapseChain`: all collapsing cells are removed in a single pass and
 * returned so the caller can spawn visual debris. This is the sim half; the
 * render side can animate the cells via rigid-body physics.
 */
export function collapseChain(grid: Grid): CellId[] {
  const state = solve(grid);
  const ids = Array.from(state.collapsing);
  // Sort top-down so the grid is internally consistent as we remove.
  ids.sort((a, b) => {
    const ay = Number(a.split(',')[1]);
    const by = Number(b.split(',')[1]);
    return by - ay;
  });
  for (const id of ids) {
    const parts = id.split(',').map(Number);
    if (parts.length !== 3) continue;
    const pos: Vec3 = {
      x: parts[0] as number,
      y: parts[1] as number,
      z: parts[2] as number,
    };
    grid.remove(pos);
  }
  return ids;
}
