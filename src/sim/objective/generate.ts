import type { Rng } from '@/sim/rng';
import {
  BAND_SHAPE_PALETTE,
  PATTERN_POOL,
  type ConnectivityThreshold,
  type SectorObjective,
} from './types';

/**
 * Map a 1-indexed sector number to a difficulty band. Log-curve spine —
 * early sectors stay in band 1; late sectors pile into band 4.
 */
export function bandForSector(sector: number): 1 | 2 | 3 | 4 {
  if (sector <= 3) return 1;
  if (sector <= 7) return 2;
  if (sector <= 12) return 3;
  return 4;
}

export function difficultyMultiplier(sector: number): number {
  return Math.log2(sector + 1);
}

/**
 * Generate a sector objective. Feasibility gate: if the pattern rolls
 * parameters that are geometrically impossible (e.g. platform count
 * requires wider-than-bounds separation), re-roll up to `maxAttempts` times.
 */
export function generateObjective(
  sector: number,
  rng: Rng,
  options: { maxAttempts?: number } = {}
): SectorObjective {
  const maxAttempts = options.maxAttempts ?? 16;
  const band = bandForSector(sector);
  const poolAtBand = PATTERN_POOL.filter((p) => p.band === band);
  if (poolAtBand.length === 0) {
    throw new Error(`objective: empty pattern pool for band ${band}`);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pattern = rng.pick(poolAtBand);
    const tierTarget = rng.int(pattern.tierTarget[0], pattern.tierTarget[1]);
    const blockBudget = rng.int(pattern.blockBudget[0], pattern.blockBudget[1]);
    const maxRounds = rng.int(pattern.maxRounds[0], pattern.maxRounds[1]);
    const connectivity: ConnectivityThreshold[] = [];
    if (pattern.connectivityTiers > 0) {
      const tiers = distributeTiers(tierTarget, pattern.connectivityTiers, rng);
      for (const t of tiers) {
        connectivity.push({
          tier: t,
          minConnected: rng.int(pattern.connectivityWidth[0], pattern.connectivityWidth[1]),
        });
      }
    }

    const objective: SectorObjective = {
      sector,
      difficultyBand: band,
      patternName: pattern.name,
      tierTarget,
      connectivity,
      blockBudgetPerRound: blockBudget,
      maxRounds,
      shapePalette: BAND_SHAPE_PALETTE[band],
      telegraph: pattern.telegraph,
    };

    if (feasible(objective)) return objective;
  }

  throw new Error(`objective: feasibility gate failed after ${maxAttempts} attempts`);
}

/** Distribute connectivity tiers between 1 and (tierTarget-1) inclusive. */
function distributeTiers(target: number, count: number, rng: Rng): number[] {
  const pool: number[] = [];
  for (let t = 1; t < target; t++) pool.push(t);
  if (count >= pool.length) return pool.slice(0, count);
  return rng.shuffle(pool).slice(0, count).sort((a, b) => a - b);
}

/**
 * Feasibility gate. Checks that:
 *   - tierTarget is reachable given the per-round block budget and maxRounds.
 *   - every connectivity threshold is ≤ a theoretical upper bound for the
 *     band's block budget.
 *   - connectivity tiers are all strictly less than tierTarget.
 */
function feasible(obj: SectorObjective): boolean {
  if (obj.tierTarget > obj.blockBudgetPerRound * obj.maxRounds) return false;
  for (const c of obj.connectivity) {
    if (c.tier >= obj.tierTarget) return false;
    if (c.minConnected > obj.blockBudgetPerRound * obj.maxRounds) return false;
  }
  return true;
}
