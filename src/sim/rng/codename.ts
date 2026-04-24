import { Rng } from './index';

/**
 * Codename generator. Three-word mathematical-abstract handles for seeds
 * (adjective-adjective-noun).
 * Deterministic from a seed — same seed reproduces the same codename.
 */

export const CODENAME_ADJECTIVES = [
  'brittle',
  'tuned',
  'drifting',
  'unraveled',
  'sharp',
  'muted',
  'recurrent',
  'null',
  'orthogonal',
  'discrete',
  'braided',
  'folded',
  'latent',
  'radiant',
  'hollow',
  'bound',
  'shattered',
  'golden'
] as const;

export const CODENAME_NOUNS = [
  'fracture',
  'vector',
  'manifold',
  'kernel',
  'epsilon',
  'tensor',
  'axiom',
  'lattice',
  'graph',
  'curve',
  'meridian',
  'bracket',
  'monolith',
  'stratum',
  'nexus',
  'pylon'
] as const;

export type CodenameAdjective = (typeof CODENAME_ADJECTIVES)[number];
export type CodenameNoun = (typeof CODENAME_NOUNS)[number];

export interface Codename {
  readonly adjective1: CodenameAdjective;
  readonly adjective2: CodenameAdjective;
  readonly noun: CodenameNoun;
  /** Hyphenated slug form, suitable as a URL seed. */
  readonly slug: string;
  /** Title-cased display form. */
  readonly display: string;
}

/** Generate a codename from an Rng fork. The caller is responsible for forking. */
export function rollCodename(rng: Rng): Codename {
  const adjective1 = rng.pick(CODENAME_ADJECTIVES);
  let adjective2 = rng.pick(CODENAME_ADJECTIVES);
  // Ensure we don't get the exact same adjective twice in a row
  while (adjective2 === adjective1) {
    adjective2 = rng.pick(CODENAME_ADJECTIVES);
  }
  const noun = rng.pick(CODENAME_NOUNS);
  return toCodename(adjective1, adjective2, noun);
}

function toCodename(adjective1: CodenameAdjective, adjective2: CodenameAdjective, noun: CodenameNoun): Codename {
  return {
    adjective1,
    adjective2,
    noun,
    slug: `${adjective1}-${adjective2}-${noun}`,
    display: `${capitalize(adjective1)} ${capitalize(adjective2)} ${capitalize(noun)}`,
  };
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Parse a slug like "brittle-tuned-manifold" back to a Codename, if all tokens are known. */
export function parseCodename(slug: string): Codename | null {
  const parts = slug.toLowerCase().split('-');
  if (parts.length !== 3) return null;
  const [adj1, adj2, noun] = parts;
  if (!(CODENAME_ADJECTIVES as readonly string[]).includes(adj1)) return null;
  if (!(CODENAME_ADJECTIVES as readonly string[]).includes(adj2)) return null;
  if (!(CODENAME_NOUNS as readonly string[]).includes(noun)) return null;
  return toCodename(adj1 as CodenameAdjective, adj2 as CodenameAdjective, noun as CodenameNoun);
}
