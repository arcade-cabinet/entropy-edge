import { describe, expect, it } from 'vitest';
import { content } from './index';
import { contentSchema } from './schemas';

describe('Compiled content', () => {
  it('round-trips through the schema at runtime', () => {
    const parsed = contentSchema.safeParse(content);
    expect(parsed.success).toBe(true);
  });

  it('has at least one pattern per difficulty band', () => {
    const bands = new Set(content.patterns.map((p) => p.band));
    expect(bands.has(1)).toBe(true);
    expect(bands.has(2)).toBe(true);
    expect(bands.has(3)).toBe(true);
    expect(bands.has(4)).toBe(true);
  });

  it('ships one shape entry per grammar kind', () => {
    const kinds = new Set(content.shapes.map((s) => s.kind));
    expect(kinds.size).toBe(16);
  });

  it('codename pool matches the compiled module word lists', () => {
    expect(content.codenameWords.adjectives.length).toBeGreaterThanOrEqual(4);
    expect(content.codenameWords.nouns.length).toBeGreaterThanOrEqual(4);
    for (const word of content.codenameWords.adjectives) {
      expect(word).toMatch(/^[a-z]+$/);
    }
  });
});
