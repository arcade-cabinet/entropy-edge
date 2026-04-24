import type { VoxelRenderer } from '@jolly-pixel/voxel.renderer';
import {
  DuelController,
  Grid,
  Rng,
  type Cell,
  type DuelState,
  type PlayerId,
  type SectorObjective,
  type ShapeKind,
  type Vec3,
} from '@/sim';
import { BLOCK_IDS } from '@/render/bridge';

export interface CommitEvent {
  readonly kind: ShapeKind;
  readonly owner: PlayerId;
  readonly cellCount: number;
}

export interface ProgressSnapshot {
  readonly yourMaxTier: number;
  readonly rivalMaxTier: number;
  readonly yourCellCount: number;
  readonly rivalCellCount: number;
}

/**
 * SimBridge — glues the pure sim layer to a JollyPixel VoxelRenderer.
 *
 * Every time the sim mutates the grid (via commitPlayer / runRivalTurn) the
 * bridge diffs the cells it has already mirrored vs. the grid's current
 * state and pushes setVoxel / removeVoxel calls into the renderer.
 *
 * This mirrors a minimal subset of the three-layer contract: sim owns
 * truth, the bridge projects truth into the renderer. UI reads DuelState
 * via the snapshot() helper.
 */

export interface SimBridgeConfig {
  readonly voxelMap: VoxelRenderer;
  readonly objective: SectorObjective;
  readonly yourAnchor: Vec3;
  readonly rivalAnchor: Vec3;
  readonly seed: string;
}

export class SimBridge {
  readonly grid: Grid;
  readonly rng: Rng;
  readonly controller: DuelController;
  private readonly mirroredCells = new Map<string, { owner: PlayerId; monument: boolean }>();
  private readonly listeners = new Set<(state: DuelState) => void>();
  private readonly commitListeners = new Set<(event: CommitEvent) => void>();
  private readonly collapseListeners = new Set<(positions: Vec3[]) => void>();
  private readonly progressListeners = new Set<(progress: ProgressSnapshot) => void>();
  private _state: DuelState;

  constructor(private readonly config: SimBridgeConfig) {
    this.grid = Grid.default();
    this.rng = new Rng(config.seed);
    this.controller = new DuelController({
      grid: this.grid,
      objective: config.objective,
      yourAnchor: config.yourAnchor,
      rivalAnchor: config.rivalAnchor,
      rng: this.rng.fork('duel'),
    });
    this._state = this.controller.state;
    this.syncRenderer();
  }

  get state(): DuelState {
    return this._state;
  }

  onChange(listener: (state: DuelState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onCommit(listener: (event: CommitEvent) => void): () => void {
    this.commitListeners.add(listener);
    return () => this.commitListeners.delete(listener);
  }

  onCollapse(listener: (positions: Vec3[]) => void): () => void {
    this.collapseListeners.add(listener);
    return () => this.collapseListeners.delete(listener);
  }

  onProgress(listener: (progress: ProgressSnapshot) => void): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  progress(): ProgressSnapshot {
    let yourMaxTier = 0;
    let rivalMaxTier = 0;
    let yourCellCount = 0;
    let rivalCellCount = 0;
    for (const cell of this.grid.values()) {
      if (cell.owner === 'you') {
        yourCellCount += 1;
        if (cell.pos.y > yourMaxTier) yourMaxTier = cell.pos.y;
      } else {
        rivalCellCount += 1;
        if (cell.pos.y > rivalMaxTier) rivalMaxTier = cell.pos.y;
      }
    }
    return { yourMaxTier, rivalMaxTier, yourCellCount, rivalCellCount };
  }

  commitPlayer(req: { kind: ShapeKind; origin: Vec3 }): DuelState {
    const before = this.grid.cellCount;
    this._state = this.controller.commitPlayer({ kind: req.kind, origin: req.origin, owner: 'you' });
    const placed = this.grid.cellCount - before;
    this.syncRenderer();
    this.emitCommit({ kind: req.kind, owner: 'you', cellCount: placed });
    this.emit();
    return this._state;
  }

  /** Seed a cell directly on the grid (bypasses budget). Used to place anchor cells. */
  seedCell(owner: PlayerId, pos: Vec3): void {
    if (this.grid.has(pos) || !this.grid.inBounds(pos)) return;
    this.grid.place({ pos, owner, compositeId: null });
    this.syncRenderer();
  }

  endYourTurn(): DuelState {
    this._state = this.controller.endYourTurn();
    this.emit();
    return this._state;
  }

  runRivalTurn(): DuelState {
    const before = this.grid.cellCount;
    this._state = this.controller.runRivalTurn();
    const placed = this.grid.cellCount - before;
    this.syncRenderer();
    if (placed > 0) {
      // Rival may have placed N cells of various kinds; we fire a coarse
      // 'cube' commit event — the full kind breakdown would require rival
      // turn telemetry from the controller, which is a later enhancement.
      this.emitCommit({ kind: 'cube', owner: 'rival', cellCount: placed });
    }
    this.emit();
    return this._state;
  }

  /** Push whatever cells have changed since the last sync into the voxel map. */
  private syncRenderer(): void {
    const seen = new Set<string>();
    for (const cell of this.grid.values()) {
      seen.add(cell.id);
      const prev = this.mirroredCells.get(cell.id);
      if (prev && prev.owner === cell.owner && prev.monument === cell.monument) {
        continue;
      }
      // Remove from any previous layer if owner/monument flag changed.
      if (prev) this.removeOnAllLayers(cell.pos);
      const { layer, blockId } = this.pick(cell);
      this.config.voxelMap.setVoxel(layer, {
        position: { x: cell.pos.x, y: cell.pos.y, z: cell.pos.z },
        blockId,
      });
      this.mirroredCells.set(cell.id, { owner: cell.owner, monument: cell.monument });
    }

    // Remove cells that no longer exist in the sim.
    const collapsed: Vec3[] = [];
    for (const [id] of this.mirroredCells) {
      if (seen.has(id)) continue;
      const parts = id.split(',').map(Number);
      if (parts.length !== 3) continue;
      const pos: Vec3 = { x: parts[0] as number, y: parts[1] as number, z: parts[2] as number };
      this.removeOnAllLayers(pos);
      this.mirroredCells.delete(id);
      collapsed.push(pos);
    }
    
    if (collapsed.length > 0) {
      for (const l of this.collapseListeners) l(collapsed);
    }
  }

  private pick(cell: Cell): { layer: string; blockId: number } {
    if (cell.monument) {
      return cell.owner === 'you'
        ? { layer: 'monument', blockId: BLOCK_IDS.PLAYER_MONUMENT }
        : { layer: 'monument', blockId: BLOCK_IDS.RIVAL_MONUMENT };
    }
    return cell.owner === 'you'
      ? { layer: 'player', blockId: BLOCK_IDS.PLAYER }
      : { layer: 'rival', blockId: BLOCK_IDS.RIVAL };
  }

  private removeOnAllLayers(pos: Vec3): void {
    for (const layer of ['player', 'rival', 'monument'] as const) {
      this.config.voxelMap.removeVoxel(layer, { position: { x: pos.x, y: pos.y, z: pos.z } });
    }
  }

  private emit(): void {
    for (const l of this.listeners) l(this._state);
    if (this.progressListeners.size > 0) {
      const snapshot = this.progress();
      for (const l of this.progressListeners) l(snapshot);
    }
  }

  private emitCommit(event: CommitEvent): void {
    for (const l of this.commitListeners) l(event);
  }
}
