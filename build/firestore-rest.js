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

/** Reads a whole collection (optionally filtered with a structuredQuery "where") and decodes the documents. */
export async function fetchCollection(projectId, collectionId, { where, fetchImpl = fetch, timeoutMs = 10_000 } = {}) {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], ...(where ? { where } : {}) } }),
  });
  if (!response.ok) throw new Error(`Firestore answered ${response.status}`);
  const rows = await response.json();
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row.document)
    .map((row) => {
      const doc = decodeDocument(row.document);
      return { ...doc, updatedAt: doc.updatedAt || row.document.updateTime };
    });
}

export const fetchPublishedPosts = (projectId, options = {}) =>
  fetchCollection(projectId, 'blog_posts', {
    ...options,
    where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
  });

/** Every project document (the rules let anyone read projects). */
export const fetchProjects = (projectId, options = {}) => fetchCollection(projectId, 'projects', options);
