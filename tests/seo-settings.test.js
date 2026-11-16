import { describe, it, expect } from 'vitest';
import { cleanSeo, resolveSeo, HOME_SEO, SEO_DOC_ID } from '../src/shared/seo-settings.js';
import { seoSchema } from '../src/shared/schemas.js';

describe('cleanSeo', () => {
  it('tidies whitespace and tolerates odd input', () => {
    expect(cleanSeo({ title: '  Muhammad   Umer  ', description: ' Hi ' })).toEqual({ title: 'Muhammad Umer', description: 'Hi' });
    for (const odd of [null, undefined, 5, 'x', []]) expect(cleanSeo(odd)).toEqual({ title: '', description: '' });
  });
  it('drops values that are too long instead of publishing a truncated result', () => {
    expect(cleanSeo({ title: 'x'.repeat(71) }).title).toBe('');
    expect(cleanSeo({ description: 'x'.repeat(161) }).description).toBe('');
  });
});

describe('resolveSeo', () => {
  it('uses the built-in text until the owner saves something, field by field', () => {
    expect(resolveSeo(null, HOME_SEO)).toEqual(HOME_SEO);
    expect(resolveSeo({ title: 'Mine', description: '' }, HOME_SEO)).toEqual({ title: 'Mine', description: HOME_SEO.description });
  });
  it('keeps the owner name in the built-in title, since that is the search the owner wants to win', () => {
    expect(HOME_SEO.title).toMatch(/Muhammad Umer Rizwan/);
    expect(SEO_DOC_ID).toBe('seo');
  });
});

describe('seoSchema', () => {
  it('accepts empty (use built-in) and rejects over-long values', () => {
    expect(seoSchema.safeParse({}).success).toBe(true);
    expect(seoSchema.safeParse({ title: 'x'.repeat(71) }).success).toBe(false);
    expect(seoSchema.safeParse({ description: 'x'.repeat(161) }).success).toBe(false);
  });
});
