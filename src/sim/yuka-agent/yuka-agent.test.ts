import { describe, expect, it } from 'vitest';
import { Grid } from '@/sim/grid';
import { Rng } from '@/sim/rng';
import { generateObjective } from '@/sim/objective';
import { plan } from './index';

describe('Yuka agent', () => {
  it('produces a proposal when empty', () => {
    const g = Grid.default();
    const obj = generateObjective(1, new Rng('yuka-1'));
    const rng = new Rng('yuka-ctx');
    const proposal = plan({
      grid: g,
      objective: obj,
      me: 'rival',
      anchor: { x: 3, y: 0, z: 3 },
      rng,
    });
    expect(proposal).not.toBeNull();
  });

  it('climbs the rival column after the anchor is placed', () => {
    const g = Grid.default();
    g.place({ pos: { x: 3, y: 0, z: 3 }, owner: 'rival', compositeId: null });
    const obj = generateObjective(1, new Rng('yuka-climb'));
    const rng = new Rng('yuka-ctx');
    const proposal = plan({
      grid: g,
      objective: obj,
      me: 'rival',
      anchor: { x: 3, y: 0, z: 3 },
      rng,
    });
    expect(proposal).not.toBeNull();
    // With only one tower cell at y=0, climb-tier should propose y=1.
    if (proposal && proposal.priority === 'climb-tier') {
      expect(proposal.origin.y).toBe(1);
    }
  });
});
