import { describe, expect, it } from 'vitest';
import { Rng } from './index';

describe('Rng', () => {
  it('is deterministic under a given seed', () => {
    const a = new Rng('alpha');
    const b = new Rng('alpha');
    expect(a.next()).toBe(b.next());
    expect(a.int(0, 100)).toBe(b.int(0, 100));
  });

  it('diverges under different seeds', () => {
    const a = new Rng('alpha');
    const b = new Rng('beta');
    expect(a.next()).not.toBe(b.next());
  });

  it('int produces values in [lo, hi] inclusive', () => {
    const r = new Rng('ranges');
    for (let i = 0; i < 1000; i++) {
      const n = r.int(5, 9);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  it('pick returns an element of the input array', () => {
    const r = new Rng('pick');
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(r.pick(items));
    }
  });

  it('shuffle is a permutation', () => {
    const r = new Rng('shuffle');
    const items = [1, 2, 3, 4, 5];
    const out = r.shuffle(items);
    expect(out).toHaveLength(items.length);
    expect(out.slice().sort()).toEqual(items);
  });

  it('fork produces deterministic sub-streams', () => {
    const parent = new Rng('parent');
    const a1 = parent.fork('a').next();
    const a2 = new Rng('parent').fork('a').next();
    expect(a1).toBe(a2);
    const b = parent.fork('b').next();
    expect(a1).not.toBe(b);
  });
});
