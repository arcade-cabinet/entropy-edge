import { describe, expect, it } from 'vitest';
import { Grid } from './index';

describe('Grid', () => {
  it('places and retrieves cells', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    expect(g.has({ x: 0, y: 0, z: 0 })).toBe(true);
    expect(g.cellCount).toBe(1);
  });

  it('rejects out-of-bounds placement', () => {
    const g = Grid.default();
    expect(() =>
      g.place({ pos: { x: 100, y: 0, z: 0 }, owner: 'you', compositeId: null })
    ).toThrow();
  });

  it('rejects double placement at same cell', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    expect(() =>
      g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'rival', compositeId: null })
    ).toThrow();
  });

  it('rejects negative y', () => {
    const g = Grid.default();
    expect(() =>
      g.place({ pos: { x: 0, y: -1, z: 0 }, owner: 'you', compositeId: null })
    ).toThrow();
  });

  it('computes maxConnectedAtTier correctly', () => {
    const g = Grid.default();
    for (let x = 0; x < 4; x++) {
      g.place({ pos: { x, y: 0, z: 0 }, owner: 'you', compositeId: null });
    }
    g.place({ pos: { x: 7, y: 0, z: 7 }, owner: 'you', compositeId: null });
    expect(g.maxConnectedAtTier(0, 'you')).toBe(4);
  });

  it('only counts cells of the specified owner when filtering', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    g.place({ pos: { x: 1, y: 0, z: 0 }, owner: 'rival', compositeId: null });
    expect(g.maxConnectedAtTier(0, 'you')).toBe(1);
    expect(g.maxConnectedAtTier(0, 'rival')).toBe(1);
  });

  it('marks monuments', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: null });
    const marked = g.markMonument({ x: 0, y: 0, z: 0 });
    expect(marked?.monument).toBe(true);
    expect(g.get({ x: 0, y: 0, z: 0 })?.monument).toBe(true);
  });

  it('remove also disassembles its composite', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'you', compositeId: 'c1' });
    g.place({ pos: { x: 1, y: 0, z: 0 }, owner: 'you', compositeId: 'c1' });
    g.registerComposite({
      id: 'c1',
      kind: 'plate2x2',
      owner: 'you',
      cellIds: ['0,0,0', '1,0,0'],
      origin: { x: 0, y: 0, z: 0 },
      capacity: 4,
      weight: 4,
    });
    g.remove({ x: 0, y: 0, z: 0 });
    expect(g.composite('c1')).toBeUndefined();
    const remaining = g.get({ x: 1, y: 0, z: 0 });
    expect(remaining?.compositeId).toBeNull();
  });
});
