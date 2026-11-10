import { describe, it, expect } from 'vitest';
import { decodeValue, decodeFields, decodeDocument, fetchPublishedPosts } from '../build/firestore-rest.js';

describe('decodeValue', () => {
  it('decodes scalars', () => {
    expect(decodeValue({ stringValue: 'hi' })).toBe('hi');
    expect(decodeValue({ integerValue: '42' })).toBe(42);
    expect(decodeValue({ doubleValue: 1.5 })).toBe(1.5);
    expect(decodeValue({ booleanValue: false })).toBe(false);
    expect(decodeValue({ timestampValue: '2026-11-07T22:11:30.699Z' })).toBe('2026-11-07T22:11:30.699Z');
    expect(decodeValue({ nullValue: null })).toBeNull();
  });
  it('decodes arrays, empty arrays and nested maps', () => {
    expect(decodeValue({ arrayValue: { values: [{ stringValue: 'a' }, { stringValue: 'b' }] } })).toEqual(['a', 'b']);
    expect(decodeValue({ arrayValue: {} })).toEqual([]);
    expect(decodeValue({ mapValue: { fields: { url: { stringValue: 'u' }, n: { integerValue: '1' } } } })).toEqual({ url: 'u', n: 1 });
    expect(decodeValue({ mapValue: {} })).toEqual({});
  });
  it('returns undefined for unknown types', () => {
    expect(decodeValue({ geoPointValue: {} })).toBeUndefined();
    expect(decodeValue(null)).toBeUndefined();
  });
});

describe('decodeDocument', () => {
  it('takes the id from the document path and decodes the fields (videos as a list of maps)', () => {
    const doc = {
      name: 'projects/p/databases/(default)/documents/blog_posts/my-post',
      fields: {
        title: { stringValue: 'T' },
        tags: { arrayValue: { values: [{ stringValue: 'C' }] } },
        videos: { arrayValue: { values: [{ mapValue: { fields: { url: { stringValue: 'https://youtu.be/dQw4w9WgXcQ' }, title: { stringValue: 'V' } } } }] } },
        published: { booleanValue: true },
      },
    };
    expect(decodeDocument(doc)).toEqual({
      id: 'my-post', title: 'T', tags: ['C'], published: true, videos: [{ url: 'https://youtu.be/dQw4w9WgXcQ', title: 'V' }],
    });
  });
  it('handles a document without fields', () => {
    expect(decodeFields(undefined)).toEqual({});
  });
});

describe('fetchPublishedPosts', () => {
  const row = (id, extra = {}) => ({
    document: { name: `projects/p/databases/(default)/documents/blog_posts/${id}`, fields: { title: { stringValue: id }, ...extra }, updateTime: '2026-11-09T00:00:00Z' },
    readTime: 'x',
  });

  it('queries only published posts and decodes the rows, ignoring the empty marker row', async () => {
    let request;
    const fetchImpl = async (url, init) => {
      request = { url, body: JSON.parse(init.body) };
      return { ok: true, json: async () => [row('a'), { readTime: 'x' }, row('b')] };
    };
    const posts = await fetchPublishedPosts('my-project', { fetchImpl });
    expect(request.url).toBe('https://firestore.googleapis.com/v1/projects/my-project/databases/(default)/documents:runQuery');
    expect(request.body.structuredQuery.where.fieldFilter).toEqual({ field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } });
    expect(posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(posts[0].updatedAt).toBe('2026-11-09T00:00:00Z');
  });
  it('throws when Firestore answers with an error, so the build can fall back', async () => {
    const fetchImpl = async () => ({ ok: false, status: 403, json: async () => ({}) });
    await expect(fetchPublishedPosts('p', { fetchImpl })).rejects.toThrow('403');
  });
  it('returns an empty list for an unexpected response shape', async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => ({ error: 'x' }) });
    expect(await fetchPublishedPosts('p', { fetchImpl })).toEqual([]);
  });
});
