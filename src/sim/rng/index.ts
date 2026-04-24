import seedrandom from 'seedrandom';

/**
 * Rng — thin wrapper around seedrandom that supports named sub-streams via
 * fork(). Forking a parent produces a deterministic child whose own state is
 * independent, so subsystems (objective / opponent / codename) cannot
 * collide on sequence-order with unrelated subsystems.
 */
export class Rng {
  private readonly prng: seedrandom.PRNG;

  constructor(public readonly seed: string) {
    this.prng = seedrandom(seed);
  }

  /** Uniform [0, 1). */
  next(): number {
    return this.prng();
  }

  /** Uniform integer in [lo, hi] inclusive. */
  int(lo: number, hi: number): number {
    if (hi < lo) throw new Error(`rng.int: hi (${hi}) < lo (${lo})`);
    return Math.floor(this.next() * (hi - lo + 1)) + lo;
  }

  /** Uniform float in [lo, hi). */
  range(lo: number, hi: number): number {
    return lo + this.next() * (hi - lo);
  }

  /** Pick from a non-empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('rng.pick: empty array');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Fisher-Yates shuffle returning a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }

  /** Deterministic sub-stream whose seed incorporates the label. */
  fork(label: string): Rng {
    return new Rng(`${this.seed}::${label}`);
  }
}
