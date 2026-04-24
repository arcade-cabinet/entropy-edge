import type { PlayerId, ShapeKind, Vec3 } from '@/sim/_shared';
import type { Grid } from '@/sim/grid';
import type { Rng } from '@/sim/rng';
import type { SectorObjective } from '@/sim/objective';
import { evaluate } from '@/sim/objective';
import { checkPlacement } from '@/sim/placement';
import { solve } from '@/sim/stability';

/**
 * Yuka-style opposing agent. Not adversarial: the rival's goal is identical
 * to the player's (satisfy the sector objective). Priority order:
 *
 *   1. Reinforce own stress — if any rival cell is stressed, shore it up.
 *   2. Satisfy next unmet threshold — shortest path to the next unmet
 *      connectivity width or tier target.
 *   3. Reuse shared geometry — anchor a connector to a player column if
 *      that is the rival's fastest move.
 *   4. Build toward tier target — extend a column upward.
 *   5. Default — place a cube on open ground near the rival's anchor.
 *
 * The agent returns a single proposed placement; the duel loop applies it,
 * updates state, and calls plan() again until the rival's block budget for
 * the turn is spent.
 */

export type RivalPriority =
  | 'reinforce-stress'
  | 'satisfy-threshold'
  | 'reuse-geometry'
  | 'climb-tier'
  | 'default-cube';

export interface RivalProposal {
  readonly kind: ShapeKind;
  readonly origin: Vec3;
  readonly priority: RivalPriority;
}

export interface RivalContext {
  readonly grid: Grid;
  readonly objective: SectorObjective;
  readonly me: PlayerId;
  readonly anchor: Vec3;
  readonly rng: Rng;
}

export function plan(ctx: RivalContext): RivalProposal | null {
  const stressRepair = planReinforceStress(ctx);
  if (stressRepair) return stressRepair;

  const thresholdMove = planSatisfyThreshold(ctx);
  if (thresholdMove) return thresholdMove;

  const climb = planClimbTier(ctx);
  if (climb) return climb;

  return planDefaultCube(ctx);
}

function planReinforceStress(ctx: RivalContext): RivalProposal | null {
  const state = solve(ctx.grid);
  const own = new Set(ctx.grid.cellsOf(ctx.me).map((c) => c.id));
  let worst: { id: string; y: number } | null = null;
  for (const id of state.stressed) {
    if (!own.has(id)) continue;
    const parts = id.split(',').map(Number);
    if (parts.length !== 3) continue;
    const y = parts[1] as number;
    if (!worst || y > worst.y) worst = { id, y };
  }
  if (!worst) return null;
  const parts = worst.id.split(',').map(Number);
  const origin: Vec3 = {
    x: (parts[0] as number) - 1,
    y: worst.y,
    z: parts[2] as number,
  };
  return {
    kind: 'diagonalBrace',
    origin,
    priority: 'reinforce-stress',
  };
}

function planSatisfyThreshold(ctx: RivalContext): RivalProposal | null {
  const progress = evaluate(ctx.grid, ctx.objective, ctx.me);
  for (const t of progress.connectivity) {
    if (t.satisfied) continue;
    const needed = t.required - t.have;
    if (needed <= 0) continue;
    const kind: ShapeKind = chooseShapeForWidth(needed, ctx.objective.shapePalette);
    const origin = findOpenAtTier(ctx, t.tier);
    if (!origin) continue;
    return { kind, origin, priority: 'satisfy-threshold' };
  }
  return null;
}

function planClimbTier(ctx: RivalContext): RivalProposal | null {
  const own = ctx.grid.cellsOf(ctx.me);
  let tallest = 0;
  let tallestPos: Vec3 | null = null;
  for (const c of own) {
    if (c.pos.y >= tallest) {
      tallest = c.pos.y;
      tallestPos = c.pos;
    }
  }
  if (!tallestPos) return null;
  const next: Vec3 = { x: tallestPos.x, y: tallestPos.y + 1, z: tallestPos.z };
  if (!ctx.grid.inBounds(next) || ctx.grid.has(next)) {
    return null;
  }
  return { kind: 'cube', origin: next, priority: 'climb-tier' };
}

function planDefaultCube(ctx: RivalContext): RivalProposal | null {
  const { anchor, grid, rng } = ctx;
  for (let attempt = 0; attempt < 16; attempt++) {
    const dx = rng.int(-1, 1);
    const dz = rng.int(-1, 1);
    const pos: Vec3 = { x: anchor.x + dx, y: 0, z: anchor.z + dz };
    if (!grid.inBounds(pos) || grid.has(pos)) continue;
    return { kind: 'cube', origin: pos, priority: 'default-cube' };
  }
  return null;
}

function chooseShapeForWidth(needed: number, palette: readonly ShapeKind[]): ShapeKind {
  if (needed >= 9 && palette.includes('plate3x3')) return 'plate3x3';
  if (needed >= 4 && palette.includes('plate2x2')) return 'plate2x2';
  return 'cube';
}

function findOpenAtTier(ctx: RivalContext, tier: number): Vec3 | null {
  const h = ctx.grid.bounds.halfExtent;
  for (let attempt = 0; attempt < 64; attempt++) {
    const x = ctx.rng.int(-h, h - 1);
    const z = ctx.rng.int(-h, h - 1);
    const pos: Vec3 = { x, y: tier, z };
    const check = checkPlacement(ctx.grid, { kind: 'cube', origin: pos, owner: ctx.me });
    if (check.validity !== 'red') return pos;
  }
  return null;
}
