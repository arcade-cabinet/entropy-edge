import { Rng } from './index';

/**
 * Codename generator. Two-word mathematical-abstract handles for seeds.
 * Deterministic from a seed — same seed reproduces the same codename.
 *
 * The word pools are provisional here; the final pools ship via the
 * content pipeline (PR G) and flow through Zod validation.
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
] as const;

export type CodenameAdjective = (typeof CODENAME_ADJECTIVES)[number];
export type CodenameNoun = (typeof CODENAME_NOUNS)[number];

export interface Codename {
  readonly adjective: CodenameAdjective;
  readonly noun: CodenameNoun;
  /** Hyphenated slug form, suitable as a URL seed. */
  readonly slug: string;
  /** Title-cased display form. */
  readonly display: string;
}

/** Generate a codename from an Rng fork. The caller is responsible for forking. */
export function rollCodename(rng: Rng): Codename {
  const adjective = rng.pick(CODENAME_ADJECTIVES);
  const noun = rng.pick(CODENAME_NOUNS);
  return toCodename(adjective, noun);
}

function toCodename(adjective: CodenameAdjective, noun: CodenameNoun): Codename {
  return {
    adjective,
    noun,
    slug: `${adjective}-${noun}`,
    display: `${capitalize(adjective)} ${capitalize(noun)}`,
  };
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Parse a slug like "tuned-manifold" back to a Codename, if both tokens are known. */
export function parseCodename(slug: string): Codename | null {
  const [adj, noun] = slug.toLowerCase().split('-');
  if (!adj || !noun) return null;
  if (!(CODENAME_ADJECTIVES as readonly string[]).includes(adj)) return null;
  if (!(CODENAME_NOUNS as readonly string[]).includes(noun)) return null;
  return toCodename(adj as CodenameAdjective, noun as CodenameNoun);
}
