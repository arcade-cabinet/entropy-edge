import { describe, expect, it } from 'vitest';
import { SHAPE_DEFS, getShapeDef } from './definitions';
import { instantiate, resetCompositeCounter } from './instance';

describe('Shape grammar', () => {
  it('every shape kind has a definition', () => {
    for (const def of Object.values(SHAPE_DEFS)) {
      expect(def.footprint.length).toBeGreaterThan(0);
      expect(def.metrics.capacity).toBeGreaterThan(0);
    }
  });

  it('cube is a single cell with its support directly below', () => {
    const def = getShapeDef('cube');
    expect(def.footprint).toHaveLength(1);
    expect(def.supportFootprint).toHaveLength(1);
    expect(def.supportFootprint[0]).toEqual({ x: 0, y: -1, z: 0 });
  });

  it('plate2x2 has 4 cells all at y=0', () => {
    const def = getShapeDef('plate2x2');
    expect(def.footprint).toHaveLength(4);
    expect(def.footprint.every((c) => c.y === 0)).toBe(true);
  });

  it('wedge has 5 cells (2x2 base + cap)', () => {
    const def = getShapeDef('wedge');
    expect(def.footprint).toHaveLength(5);
    const caps = def.footprint.filter((c) => c.y === 1);
    expect(caps).toHaveLength(1);
  });

  it('pyramid has 9 + 4 + 1 = 14 cells', () => {
    const def = getShapeDef('pyramid');
    expect(def.footprint).toHaveLength(14);
  });

  it('instantiate produces a unique composite id per call', () => {
    resetCompositeCounter();
    const a = instantiate('cube', { x: 0, y: 0, z: 0 }, 'you');
    const b = instantiate('cube', { x: 0, y: 0, z: 0 }, 'you');
    expect(a.id).not.toBe(b.id);
  });

  it('instantiate translates footprint to world coords', () => {
    resetCompositeCounter();
    const inst = instantiate('plate2x2', { x: 3, y: 0, z: 5 }, 'you');
    expect(inst.cellPositions).toContainEqual({ x: 3, y: 0, z: 5 });
    expect(inst.cellPositions).toContainEqual({ x: 4, y: 0, z: 6 });
  });
});
