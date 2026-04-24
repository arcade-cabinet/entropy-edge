import { describe, expect, it } from 'vitest';
import { Grid } from '@/sim/grid';
import { solve, collapseChain } from './index';

describe('Stability solver', () => {
  it('ground cells have infinite capacity', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    const state = solve(g);
    expect(state.capacities.get('0,0,0')).toBe(Number.POSITIVE_INFINITY);
    expect(state.stressed.has('0,0,0')).toBe(false);
  });

  it('a stack of 3 cubes is stable', () => {
    const g = Grid.default();
    for (let y = 0; y < 3; y++) {
      g.place({ pos: { x: 0, y, z: 0 }, owner: 'you', compositeId: null });
    }
    const state = solve(g);
    expect(state.stressed.size).toBe(0);
  });

  it('a cantilever 1 away is legal; 2 away is stressed', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    g.place({ pos: { x: 0, y: 1, z: 0 }, owner: 'you', compositeId: null });
    g.place({ pos: { x: 1, y: 1, z: 0 }, owner: 'you', compositeId: null });
    const stateShort = solve(g);
    expect(stateShort.stressed.has('1,1,0')).toBe(false);

    g.place({ pos: { x: 2, y: 1, z: 0 }, owner: 'you', compositeId: null });
    const stateLong = solve(g);
    expect(stateLong.stressed.has('2,1,0')).toBe(true);
  });

  it('collapseChain removes the stressed cell', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    g.place({ pos: { x: 0, y: 1, z: 0 }, owner: 'you', compositeId: null });
    g.place({ pos: { x: 0, y: 2, z: 0 }, owner: 'you', compositeId: null });
    // Add a cantilever far from support so it's stressed.
    g.place({ pos: { x: 3, y: 2, z: 0 }, owner: 'you', compositeId: null });
    const collapsed = collapseChain(g);
    expect(collapsed.length).toBeGreaterThan(0);
    expect(g.has({ x: 3, y: 2, z: 0 })).toBe(false);
  });
});
