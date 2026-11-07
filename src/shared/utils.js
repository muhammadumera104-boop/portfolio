// Small pure helpers shared by the public pages and the admin dashboard.

/** "Hello, World!" -> "hello-world" */
export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Strip tags from an HTML string and collapse whitespace. */
export function htmlToText(html) {
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minutes to read, at 200 words per minute, never below 1. */
export function readingTime(html) {
  const words = htmlToText(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** A short plain-text excerpt, cut on a word boundary. */
export function makeExcerpt(html, max = 160) {
  const text = htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).trim()}…`;
}

/** Firestore Timestamp | Date | number | undefined -> Date | null */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Sort comparator: newest first. Accepts Firestore timestamps, Dates, ISO strings and numbers; undated items go last. */
export function newestFirst(a, b) {
  return (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0);
}

export function formatDate(value, locale = 'en-GB') {
  const date = toDate(value);
  return date ? date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/** Case-insensitive match against title, excerpt and tags, plus an optional tag filter. */
export function filterPosts(posts, { search = '', tag = '' } = {}) {
  const needle = search.trim().toLowerCase();
  return posts.filter((post) => {
    if (tag && !(post.tags || []).includes(tag)) return false;
    if (!needle) return true;
    const haystack = [post.title, post.excerpt, ...(post.tags || [])].join(' ').toLowerCase();
    return haystack.includes(needle);
  });
}

/** Returns one page of items plus paging info. Out-of-range pages are clamped. */
export function paginate(items, page = 1, perPage = 6) {
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const start = (current - 1) * perPage;
  return { items: items.slice(start, start + perPage), page: current, pages, total: items.length };
}

/** Other published posts that share the most tags with `post`. */
export function relatedPosts(post, all, count = 3) {
  const tags = new Set(post.tags || []);
  return all
    .filter((p) => p.id !== post.id)
    .map((p) => ({ post: p, score: (p.tags || []).filter((t) => tags.has(t)).length }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((entry) => entry.post);
}

/** "a, b ,, c" -> ['a','b','c'] */
export function parseCsv(text) {
  return String(text)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** One item per non-empty line. */
export function parseLines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
