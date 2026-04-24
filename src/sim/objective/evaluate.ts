import type { PlayerId } from '@/sim/_shared';
import type { Grid } from '@/sim/grid';
import type { SectorObjective } from './types';

/**
 * Objective evaluation. Given the current grid and an objective, report how
 * many thresholds a player has satisfied and whether they have claimed the
 * sector.
 */

export interface ObjectiveProgress {
  readonly player: PlayerId;
  /** Maximum tier the player has any cell at. */
  readonly maxTier: number;
  /** Per-threshold satisfaction. */
  readonly connectivity: readonly {
    readonly tier: number;
    readonly required: number;
    readonly have: number;
    readonly satisfied: boolean;
  }[];
  /** True if every threshold is satisfied AND maxTier ≥ tierTarget. */
  readonly claimed: boolean;
}

export function evaluate(
  grid: Grid,
  objective: SectorObjective,
  player: PlayerId
): ObjectiveProgress {
  let maxTier = 0;
  for (const c of grid.cellsOf(player)) {
    if (c.pos.y > maxTier) maxTier = c.pos.y;
  }

  const connectivity = objective.connectivity.map((t) => {
    const have = grid.maxConnectedAtTier(t.tier, player);
    return {
      tier: t.tier,
      required: t.minConnected,
      have,
      satisfied: have >= t.minConnected,
    };
  });

  const allConnectivity = connectivity.every((t) => t.satisfied);
  const hitTier = maxTier >= objective.tierTarget;
  const claimed = allConnectivity && hitTier;
  return { player, maxTier, connectivity, claimed };
}
