import { describe, expect, it } from 'vitest';
import { Grid } from '@/sim/grid';
import { Rng } from '@/sim/rng';
import { bandForSector, difficultyMultiplier, evaluate, generateObjective } from './index';

describe('Objective', () => {
  it('bandForSector is monotone in sector', () => {
    expect(bandForSector(1)).toBe(1);
    expect(bandForSector(5)).toBe(2);
    expect(bandForSector(10)).toBe(3);
    expect(bandForSector(15)).toBe(4);
  });

  it('difficultyMultiplier is strictly increasing', () => {
    expect(difficultyMultiplier(1)).toBeLessThan(difficultyMultiplier(2));
    expect(difficultyMultiplier(5)).toBeLessThan(difficultyMultiplier(10));
  });

  it('generateObjective returns a feasible sector objective', () => {
    const rng = new Rng('gen-test');
    const obj = generateObjective(3, rng);
    expect(obj.tierTarget).toBeGreaterThan(0);
    expect(obj.blockBudgetPerRound * obj.maxRounds).toBeGreaterThanOrEqual(obj.tierTarget);
    for (const t of obj.connectivity) {
      expect(t.tier).toBeLessThan(obj.tierTarget);
    }
  });

  it('generateObjective is deterministic under a seed', () => {
    const a = generateObjective(5, new Rng('seed-a'));
    const b = generateObjective(5, new Rng('seed-a'));
    expect(a).toEqual(b);
  });

  it('evaluate reports maxTier correctly', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    g.place({ pos: { x: 0, y: 1, z: 0 }, owner: 'you', compositeId: null });
    g.place({ pos: { x: 0, y: 2, z: 0 }, owner: 'you', compositeId: null });
    const obj = generateObjective(1, new Rng('eval-test'));
    const progress = evaluate(g, obj, 'you');
    expect(progress.maxTier).toBe(2);
  });

  it('evaluate reports claimed when threshold + tier both hit', () => {
    const g = Grid.default();
    // Stack to tier 4
    for (let y = 0; y <= 4; y++) {
      g.place({ pos: { x: 0, y, z: 0 }, owner: 'you', compositeId: null });
    }
    const obj = {
      sector: 1,
      difficultyBand: 1 as const,
      patternName: 'test',
      tierTarget: 4,
      connectivity: [],
      blockBudgetPerRound: 5,
      maxRounds: 10,
      shapePalette: ['cube' as const],
      telegraph: '',
    };
    const progress = evaluate(g, obj, 'you');
    expect(progress.claimed).toBe(true);
  });
});
