import {
  cellId,
  type Cell,
  type CellId,
  type Composite,
  type PlayerId,
  type Vec3,
} from '@/sim/_shared';

/**
 * Grid — the integer voxel lattice. Every cell is identified by "x,y,z"
 * coordinates; there are no multi-cell block types here — composites are a
 * layer above that points to many 1×1 cells.
 *
 * Bounds are enforced in x/z via gridHalfExtent (centered at origin);
 * y ≥ 0 (ground plane at y=0).
 */

export interface GridBounds {
  /** Half-extent along x and z. xMin = -halfExtent, xMax = +halfExtent - 1. */
  readonly halfExtent: number;
  /** Upper bound on y (inclusive). Ground is y=0. */
  readonly maxY: number;
}

export interface PlacementInput {
  readonly pos: Vec3;
  readonly owner: PlayerId;
  readonly compositeId: string | null;
}

export class Grid {
  private readonly cells = new Map<CellId, Cell>();
  private readonly composites = new Map<string, Composite>();

  constructor(public readonly bounds: GridBounds) {}

  static default(): Grid {
    return new Grid({ halfExtent: 12, maxY: 20 });
  }

  /** Number of placed cells. */
  get cellCount(): number {
    return this.cells.size;
  }

  /** True if (x,y,z) is within bounds. */
  inBounds(pos: Vec3): boolean {
    const { x, y, z } = pos;
    const h = this.bounds.halfExtent;
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      Number.isInteger(z) &&
      x >= -h &&
      x < h &&
      z >= -h &&
      z < h &&
      y >= 0 &&
      y <= this.bounds.maxY
    );
  }

  /** True if a cell exists at (x,y,z). */
  has(pos: Vec3): boolean {
    return this.cells.has(cellId(pos.x, pos.y, pos.z));
  }

  /** Read-only access to a cell at (x,y,z). */
  get(pos: Vec3): Cell | undefined {
    return this.cells.get(cellId(pos.x, pos.y, pos.z));
  }

  /** Iterate all cells. */
  *values(): IterableIterator<Cell> {
    yield* this.cells.values();
  }

  /** All cell ids owned by a given player. */
  cellsOf(owner: PlayerId): Cell[] {
    const out: Cell[] = [];
    for (const c of this.cells.values()) if (c.owner === owner) out.push(c);
    return out;
  }

  /** Read-only composite lookup. */
  composite(id: string): Composite | undefined {
    return this.composites.get(id);
  }

  /** All composites. */
  *allComposites(): IterableIterator<Composite> {
    yield* this.composites.values();
  }

  /**
   * Place a single cell. Throws if out of bounds or occupied.
   * Returns the inserted cell.
   */
  place(input: PlacementInput): Cell {
    const { pos, owner, compositeId } = input;
    if (!this.inBounds(pos)) {
      throw new Error(`grid.place: out of bounds ${JSON.stringify(pos)}`);
    }
    const id = cellId(pos.x, pos.y, pos.z);
    if (this.cells.has(id)) {
      throw new Error(`grid.place: cell occupied ${id}`);
    }
    const cell: Cell = { id, pos, owner, compositeId, monument: false };
    this.cells.set(id, cell);
    return cell;
  }

  /** Remove a cell. Returns the removed cell or undefined if absent. */
  remove(pos: Vec3): Cell | undefined {
    const id = cellId(pos.x, pos.y, pos.z);
    const cell = this.cells.get(id);
    if (!cell) return undefined;
    this.cells.delete(id);
    if (cell.compositeId) {
      const composite = this.composites.get(cell.compositeId);
      if (composite) {
        // Reverse-transform — remove the composite header; component cells
        // that remain stay as individual cells with their compositeId cleared.
        this.composites.delete(composite.id);
        for (const otherId of composite.cellIds) {
          if (otherId === id) continue;
          const other = this.cells.get(otherId);
          if (other && other.compositeId === composite.id) {
            this.cells.set(otherId, { ...other, compositeId: null });
          }
        }
      }
    }
    return cell;
  }

  /** Mark a cell as a monument (immutable thereafter for the run). */
  markMonument(pos: Vec3): Cell | undefined {
    const id = cellId(pos.x, pos.y, pos.z);
    const existing = this.cells.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, monument: true };
    this.cells.set(id, updated);
    return updated;
  }

  /** Register a composite. Component cells must already exist. */
  registerComposite(composite: Composite): void {
    for (const cid of composite.cellIds) {
      const cell = this.cells.get(cid);
      if (!cell) {
        throw new Error(`grid.registerComposite: missing component cell ${cid}`);
      }
      if (cell.compositeId && cell.compositeId !== composite.id) {
        throw new Error(
          `grid.registerComposite: cell ${cid} already in composite ${cell.compositeId}`
        );
      }
      this.cells.set(cid, { ...cell, compositeId: composite.id });
    }
    this.composites.set(composite.id, composite);
  }

  /** How many cells at tier y are in a single 4-connected component ≥ threshold? */
  maxConnectedAtTier(y: number, owner?: PlayerId): number {
    const atTier: Cell[] = [];
    for (const c of this.cells.values()) {
      if (c.pos.y !== y) continue;
      if (owner && c.owner !== owner) continue;
      atTier.push(c);
    }
    const visited = new Set<CellId>();
    let best = 0;
    for (const start of atTier) {
      if (visited.has(start.id)) continue;
      const stack: Cell[] = [start];
      let size = 0;
      while (stack.length > 0) {
        const cur = stack.pop() as Cell;
        if (visited.has(cur.id)) continue;
        visited.add(cur.id);
        size += 1;
        for (const neighbor of this.neighbors4(cur.pos, y)) {
          if (owner && neighbor.owner !== owner) continue;
          if (!visited.has(neighbor.id)) stack.push(neighbor);
        }
      }
      if (size > best) best = size;
    }
    return best;
  }

  /** 4-connected neighbors at the same y. */
  private neighbors4(pos: Vec3, y: number): Cell[] {
    const out: Cell[] = [];
    for (const [dx, dz] of NEIGHBOR_OFFSETS) {
      const neighbor = this.get({ x: pos.x + dx, y, z: pos.z + dz });
      if (neighbor) out.push(neighbor);
    }
    return out;
  }
}

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
