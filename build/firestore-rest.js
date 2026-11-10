// Reads published blog posts from Firestore over its public REST API at build time, so the build can
// prerender them into plain HTML for search engines. No SDK, no credentials: the security rules already
// allow anyone to read published posts. If anything fails, the caller falls back to the built-in posts.

/** Firestore REST value -> plain JS value. */
export function decodeValue(value) {
  if (value == null || typeof value !== 'object') return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields);
  return undefined;
}

export function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

/** One document from a runQuery response -> { id, ...fields }. */
export function decodeDocument(doc) {
  const id = String(doc.name || '').split('/').pop();
  return { id, ...decodeFields(doc.fields) };
}

export async function fetchPublishedPosts(projectId, { fetchImpl = fetch, timeoutMs = 10_000 } = {}) {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'blog_posts' }],
        where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
      },
    }),
  });
  if (!response.ok) throw new Error(`Firestore answered ${response.status}`);
  const rows = await response.json();
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row.document)
    .map((row) => {
      const post = decodeDocument(row.document);
      return { ...post, updatedAt: post.updatedAt || row.document.updateTime };
    });
}
