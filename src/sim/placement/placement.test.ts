import { describe, expect, it } from 'vitest';
import { Grid } from '@/sim/grid';
import { checkPlacement, commitPlacement } from './index';
import { resetCompositeCounter } from '@/sim/shapes';

describe('Placement', () => {
  it('green for a cube on ground', () => {
    const g = Grid.default();
    const c = checkPlacement(g, { kind: 'cube', origin: { x: 0, y: 0, z: 0 }, owner: 'you' });
    expect(c.validity).toBe('green');
  });

  it('red when cell is occupied', () => {
    const g = Grid.default();
    g.place({ pos: { x: 0, y: 0, z: 0 }, owner: 'rival', compositeId: null });
    const c = checkPlacement(g, { kind: 'cube', origin: { x: 0, y: 0, z: 0 }, owner: 'you' });
    expect(c.validity).toBe('red');
    expect(c.reason).toBe('cell occupied');
  });

  it('red when out of bounds', () => {
    const g = Grid.default();
    const c = checkPlacement(g, { kind: 'cube', origin: { x: 999, y: 0, z: 0 }, owner: 'you' });
    expect(c.validity).toBe('red');
    expect(c.reason).toBe('out of bounds');
  });

  it('red when support is missing', () => {
    const g = Grid.default();
    const c = checkPlacement(g, { kind: 'cube', origin: { x: 0, y: 3, z: 0 }, owner: 'you' });
    expect(c.validity).toBe('red');
    expect(c.reason).toBe('missing support');
  });

  it('commitPlacement registers a composite for multi-cell shapes', () => {
    resetCompositeCounter();
    const g = Grid.default();
    const result = commitPlacement(g, { kind: 'plate2x2', origin: { x: 0, y: 0, z: 0 }, owner: 'you' });
    expect(result.placedCellIds).toHaveLength(4);
    expect(result.compositeId).not.toBeNull();
    expect(g.composite(result.compositeId as string)).toBeDefined();
  });

  it('commitPlacement does not register a composite for a single cube', () => {
    resetCompositeCounter();
    const g = Grid.default();
    const result = commitPlacement(g, { kind: 'cube', origin: { x: 0, y: 0, z: 0 }, owner: 'you' });
    expect(result.compositeId).toBeNull();
  });
});
