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
    expect(CODENAME_ADJECTIVES).toContain(c.adjective1);
    expect(CODENAME_ADJECTIVES).toContain(c.adjective2);
    expect(CODENAME_NOUNS).toContain(c.noun);
    expect(c.slug).toBe(`${c.adjective1}-${c.adjective2}-${c.noun}`);
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
    expect(parseCodename('brittle-tuned')).toBeNull();
    expect(parseCodename('brittle-tuned-bogus')).toBeNull();
  });
});

describe('resolveSeed', () => {
  it('uses a provided codename slug', () => {
    const { codename } = resolveSeed('brittle-tuned-manifold');
    expect(codename.slug).toBe('brittle-tuned-manifold');
  });

  it('falls back to a fresh codename when input is absent', () => {
    const a = resolveSeed(null);
    expect(CODENAME_ADJECTIVES).toContain(a.codename.adjective1);
    expect(CODENAME_NOUNS).toContain(a.codename.noun);
  });

  it('falls back when input is malformed', () => {
    const a = resolveSeed('this-is-not-a-valid-codename');
    expect(CODENAME_ADJECTIVES).toContain(a.codename.adjective1);
  });

  it('is deterministic — same codename slug → same rng sequence', () => {
    const a = resolveSeed('brittle-sharp-kernel');
    const b = resolveSeed('brittle-sharp-kernel');
    expect(a.rng.next()).toBe(b.rng.next());
  });
});

describe('shareUrlForSeed', () => {
  it('includes the slug as a ?seed= query param', () => {
    const { codename } = resolveSeed('brittle-sharp-kernel');
    const url = shareUrlForSeed(codename, 'https://entropy.example', '/entropy-edge/');
    expect(url).toBe('https://entropy.example/entropy-edge/?seed=brittle-sharp-kernel');
  });
});
