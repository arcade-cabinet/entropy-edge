import { describe, expect, it } from 'vitest';
import { Rng } from './index';
import {
  CODENAME_ADJECTIVES,
  CODENAME_NOUNS,
  parseCodename,
  rollCodename,
} from './codename';
import { resolveSeed, shareUrlForSeed } from './seed';

describe('Codename', () => {
  it('rolls deterministically from a seed', () => {
    const a = rollCodename(new Rng('repeat-me'));
    const b = rollCodename(new Rng('repeat-me'));
    expect(a).toEqual(b);
  });

  it('produces words from the allowed pools', () => {
    const c = rollCodename(new Rng('any-seed'));
    expect(CODENAME_ADJECTIVES).toContain(c.adjective);
    expect(CODENAME_NOUNS).toContain(c.noun);
    expect(c.slug).toBe(`${c.adjective}-${c.noun}`);
  });

  it('parseCodename round-trips a valid slug', () => {
    const original = rollCodename(new Rng('rt-seed'));
    const parsed = parseCodename(original.slug);
    expect(parsed).toEqual(original);
  });

  it('parseCodename rejects unknown slugs', () => {
    expect(parseCodename('unknown-word')).toBeNull();
    expect(parseCodename('')).toBeNull();
    expect(parseCodename('tuned')).toBeNull();
    expect(parseCodename('tuned-bogus')).toBeNull();
  });
});

describe('resolveSeed', () => {
  it('uses a provided codename slug', () => {
    const { codename } = resolveSeed('tuned-manifold');
    expect(codename.slug).toBe('tuned-manifold');
  });

  it('falls back to a fresh codename when input is absent', () => {
    const a = resolveSeed(null);
    expect(CODENAME_ADJECTIVES).toContain(a.codename.adjective);
    expect(CODENAME_NOUNS).toContain(a.codename.noun);
  });

  it('falls back when input is malformed', () => {
    const a = resolveSeed('this-is-not-a-valid-codename');
    expect(CODENAME_ADJECTIVES).toContain(a.codename.adjective);
  });

  it('is deterministic — same codename slug → same rng sequence', () => {
    const a = resolveSeed('sharp-kernel');
    const b = resolveSeed('sharp-kernel');
    expect(a.rng.next()).toBe(b.rng.next());
  });
});

describe('shareUrlForSeed', () => {
  it('includes the slug as a ?seed= query param', () => {
    const { codename } = resolveSeed('sharp-kernel');
    const url = shareUrlForSeed(codename, 'https://entropy.example', '/entropy-edge/');
    expect(url).toBe('https://entropy.example/entropy-edge/?seed=sharp-kernel');
  });
});
