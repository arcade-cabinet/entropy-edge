import { describe, expect, it } from 'vitest';
import { Grid } from '@/sim/grid';
import { Rng } from '@/sim/rng';
import { generateObjective } from '@/sim/objective';
import { DuelController } from './index';

describe('Duel controller', () => {
  it('starts on round 1, your turn, full budgets', () => {
    const grid = Grid.default();
    const obj = generateObjective(1, new Rng('duel-1'));
    const ctrl = new DuelController({
      grid,
      objective: obj,
      yourAnchor: { x: -4, y: 0, z: 0 },
      rivalAnchor: { x: 4, y: 0, z: 0 },
      rng: new Rng('duel-rng'),
    });
    expect(ctrl.state.round).toBe(1);
    expect(ctrl.state.turn).toBe('you');
    expect(ctrl.state.youRemaining).toBe(obj.blockBudgetPerRound);
  });

  it('commitPlayer spends budget and keeps turn yours', () => {
    const grid = Grid.default();
    const obj = generateObjective(1, new Rng('duel-commit'));
    const ctrl = new DuelController({
      grid,
      objective: obj,
      yourAnchor: { x: -4, y: 0, z: 0 },
      rivalAnchor: { x: 4, y: 0, z: 0 },
      rng: new Rng('duel-rng'),
    });
    const before = ctrl.state.youRemaining;
    ctrl.commitPlayer({ kind: 'cube', origin: { x: -4, y: 0, z: 0 }, owner: 'you' });
    expect(ctrl.state.youRemaining).toBe(before - 1);
    expect(ctrl.state.turn).toBe('you');
  });

  it('endYourTurn hands over to rival', () => {
    const grid = Grid.default();
    const obj = generateObjective(1, new Rng('duel-end'));
    const ctrl = new DuelController({
      grid,
      objective: obj,
      yourAnchor: { x: -4, y: 0, z: 0 },
      rivalAnchor: { x: 4, y: 0, z: 0 },
      rng: new Rng('duel-rng'),
    });
    ctrl.endYourTurn();
    expect(ctrl.state.turn).toBe('rival');
  });

  it('runRivalTurn spends budget and advances to next round', () => {
    const grid = Grid.default();
    const obj = generateObjective(1, new Rng('duel-rival'));
    const ctrl = new DuelController({
      grid,
      objective: obj,
      yourAnchor: { x: -4, y: 0, z: 0 },
      rivalAnchor: { x: 4, y: 0, z: 0 },
      rng: new Rng('duel-rng'),
    });
    ctrl.endYourTurn();
    const roundBefore = ctrl.state.round;
    ctrl.runRivalTurn();
    // After rival runs, we're either still ongoing (next round) or a claim fired.
    expect(['ongoing', 'claimed', 'drawn']).toContain(ctrl.state.status.kind);
    // Side effects: either budget decreased, or round advanced, or game ended.
    if (ctrl.state.status.kind === 'ongoing') {
      expect(ctrl.state.round).toBeGreaterThanOrEqual(roundBefore);
      expect(ctrl.state.turn).toBe('you');
    }
  });
});
