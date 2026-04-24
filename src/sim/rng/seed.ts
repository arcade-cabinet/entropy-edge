import { Rng } from './index';
import { parseCodename, rollCodename, type Codename } from './codename';

/**
 * Seed — resolves an incoming URL parameter (or generates a fresh codename-
 * backed one) into a deterministic Rng + Codename pair.
 *
 * Inputs:
 *   - a valid codename slug → deterministic replay
 *   - anything else / empty  → roll a fresh codename from Date.now()
 *
 * The codename *is* the seed. Two runs with the same codename produce the
 * same sector objectives, the same rival moves, the same everything —
 * physics is the only non-deterministic layer (visual collapse only).
 */

export interface ResolvedSeed {
  readonly rng: Rng;
  readonly codename: Codename;
}

export function resolveSeed(raw: string | null | undefined): ResolvedSeed {
  const provided = raw?.trim().toLowerCase();
  if (provided) {
    const parsed = parseCodename(provided);
    if (parsed) {
      return { rng: new Rng(parsed.slug), codename: parsed };
    }
  }
  // Fallback: roll a fresh codename. Millisecond-resolution seed stream —
  // callers wanting a reproducible daily seed use sim/session/daily.ts.
  const scratchRng = new Rng(`scratch-${Date.now()}-${Math.floor(Math.random() * 1e9)}`);
  const codename = rollCodename(scratchRng);
  return { rng: new Rng(codename.slug), codename };
}

export function resolveDailySeed(now: Date = new Date()): ResolvedSeed {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const dailyStr = `daily-${y}${m}${d}`;
  const scratchRng = new Rng(dailyStr);
  const codename = rollCodename(scratchRng);
  return { rng: new Rng(codename.slug), codename };
}

/** Read ?seed=... from a URL search string; null if absent. */
export function readSeedFromLocation(search: string): string | null {
  return new URLSearchParams(search).get('seed');
}

/** Build a share URL for the given codename using the current origin + pathname. */
export function shareUrlForSeed(codename: Codename, origin: string, pathname: string): string {
  return `${origin}${pathname}?seed=${encodeURIComponent(codename.slug)}`;
}
