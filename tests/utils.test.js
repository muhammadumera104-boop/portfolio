import { describe, it, expect } from 'vitest';
import {
  slugify, htmlToText, readingTime, makeExcerpt, filterPosts, paginate, relatedPosts, parseCsv, parseLines, toDate, formatDate,
} from '../src/shared/utils.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => expect(slugify('Hello, World!')).toBe('hello-world'));
  it('strips accents and edge hyphens', () => expect(slugify('  Café — Déjà vu  ')).toBe('cafe-deja-vu'));
  it('caps the length at 80', () => expect(slugify('a'.repeat(200)).length).toBe(80));
  it('returns an empty string when nothing usable is left', () => expect(slugify('!!!')).toBe(''));
});

describe('htmlToText / readingTime / makeExcerpt', () => {
  it('removes tags, scripts and entities', () => {
    expect(htmlToText('<p>Hi&nbsp;<b>there</b></p><script>alert(1)</script>')).toBe('Hi there');
  });
  it('rounds reading time up and never goes below 1', () => {
    expect(readingTime('<p>short</p>')).toBe(1);
    expect(readingTime(`<p>${'word '.repeat(401)}</p>`)).toBe(3);
  });
  it('cuts excerpts on a word boundary', () => {
    const out = makeExcerpt(`<p>${'alpha '.repeat(60)}</p>`, 30);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(31);
    expect(out).not.toMatch(/alph…$/);
  });
  it('keeps short text unchanged', () => expect(makeExcerpt('<p>Tiny</p>')).toBe('Tiny'));
});

describe('filterPosts', () => {
  const posts = [
    { id: '1', title: 'Memory allocators', excerpt: 'free lists', tags: ['C', 'Systems'] },
    { id: '2', title: 'A* explained', excerpt: 'pathfinding', tags: ['Python'] },
  ];
  it('returns everything for empty filters', () => expect(filterPosts(posts)).toHaveLength(2));
  it('searches title, excerpt and tags case-insensitively', () => {
    expect(filterPosts(posts, { search: 'FREE' }).map((p) => p.id)).toEqual(['1']);
    expect(filterPosts(posts, { search: 'python' }).map((p) => p.id)).toEqual(['2']);
  });
  it('filters by tag', () => expect(filterPosts(posts, { tag: 'Systems' }).map((p) => p.id)).toEqual(['1']));
  it('combines search and tag', () => expect(filterPosts(posts, { search: 'a*', tag: 'C' })).toHaveLength(0));
});

describe('paginate', () => {
  const items = Array.from({ length: 14 }, (_, i) => i);
  it('slices pages', () => expect(paginate(items, 2, 6).items).toEqual([6, 7, 8, 9, 10, 11]));
  it('reports page count', () => expect(paginate(items, 1, 6).pages).toBe(3));
  it('clamps out-of-range pages', () => {
    expect(paginate(items, 99, 6).page).toBe(3);
    expect(paginate(items, -4, 6).page).toBe(1);
    expect(paginate(items, Number.NaN, 6).page).toBe(1);
  });
  it('handles an empty list', () => expect(paginate([], 1, 6)).toMatchObject({ items: [], pages: 1, total: 0 }));
});

describe('relatedPosts', () => {
  const a = { id: 'a', tags: ['C', 'Systems'] };
  const all = [a, { id: 'b', tags: ['C'] }, { id: 'c', tags: ['C', 'Systems'] }, { id: 'd', tags: ['Web'] }];
  it('ranks by shared tags, excludes itself and unrelated posts', () => {
    expect(relatedPosts(a, all).map((p) => p.id)).toEqual(['c', 'b']);
  });
  it('respects the count', () => expect(relatedPosts(a, all, 1)).toHaveLength(1));
});

describe('parsers and dates', () => {
  it('parseCsv trims and drops blanks', () => expect(parseCsv('a, b ,, c')).toEqual(['a', 'b', 'c']));
  it('parseLines drops blank lines', () => expect(parseLines('one\n\n two \r\nthree')).toEqual(['one', 'two', 'three']));
  it('toDate accepts Firestore-like timestamps, dates and rejects junk', () => {
    const d = new Date('2026-01-02T00:00:00Z');
    expect(toDate({ toDate: () => d })).toBe(d);
    expect(toDate(d.getTime()).getTime()).toBe(d.getTime());
    expect(toDate('not a date')).toBeNull();
    expect(toDate(undefined)).toBeNull();
  });
  it('formatDate returns an empty string for missing dates', () => expect(formatDate(null)).toBe(''));
});
