// Pure helpers for the Ctrl/Cmd+K command palette: what can be found, and how results are ranked.
// No DOM here, so all of it is covered by tests. The dialog itself is in scripts/palette.js.
import { nav, projects as caseStudies, webProjects } from '../data/content.js';
import { postPath, projectPath } from './seo.js';

const GROUP_ORDER = { Section: 0, Project: 1, Post: 2 };

/** Words people might type for a section, besides its name. */
const SECTION_WORDS = {
  '#about': 'who me bio terminal console',
  '#skills': 'languages tools c python c++ javascript',
  '#journey': 'learning path timeline steps',
  '#projects': 'work case studies portfolio',
  '#education': 'school college university gu tech degree matric intermediate',
  '#contact': 'email message hire write reach',
  '/blog/': 'posts articles writing notes',
};

/** Sections that may be missing on the home page (the owner can hide "Now"); `id` lets the palette check the page. */
const EXTRA_SECTIONS = [
  { title: 'Now', hint: 'What I am building and learning this month', url: '/#now', id: 'now', words: 'current month building learning' },
  { title: 'Introduction video', hint: 'Meet Umer in two minutes', url: '/#intro', id: 'intro', words: 'video intro meet transcript' },
  { title: 'GitHub and LinkedIn', hint: 'Find my work online', url: '/#online', id: 'online', words: 'github linkedin code repositories social' },
];

/** A link that always works, from any page: '#about' becomes '/#about'. */
const absolute = (href) => (href.startsWith('#') ? `/${href}` : href);

/** Only same-site paths are allowed as targets ('/x', never '//evil.example' or 'javascript:'). */
export const isSitePath = (value) => typeof value === 'string' && /^\/(?!\/)[^\s]*$/.test(value);

export const sectionItems = () => [
  ...nav.map((n) => ({ group: 'Section', title: n.label, hint: '', url: absolute(n.href), words: SECTION_WORDS[n.href] || '' })),
  ...EXTRA_SECTIONS.map((s) => ({ group: 'Section', title: s.title, hint: s.hint, url: s.url, words: s.words, id: s.id })),
];

/** The projects that ship with the site, used until the search index has loaded (or if it cannot). */
export const builtInProjectItems = () =>
  [...caseStudies.map((p) => ({ slug: p.id, title: p.title, kind: p.kind })), ...webProjects.map((p) => ({ slug: p.slug, title: p.title, kind: p.kind || p.category }))].map(
    (p) => ({ group: 'Project', title: p.title, hint: p.kind || '', url: projectPath(p.slug), words: '' }),
  );

/**
 * What the build writes to /search-index.json: titles and addresses of the projects and posts that exist right now.
 * Kept small on purpose (a short excerpt, no article text) so opening the palette is fast.
 */
export function searchIndex({ projects = [], posts = [] } = {}) {
  const short = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
  return {
    v: 1,
    projects: projects.map((p) => ({ title: String(p.title), url: projectPath(p.slug), kind: short(p.kind || p.category) })),
    posts: posts.map((p) => ({ title: String(p.title), url: postPath(p.slug), kind: short(p.category), text: short(p.excerpt) })),
  };
}

/** Turns the downloaded index into palette items. Anything malformed, or pointing off-site, is ignored. */
export function itemsFromIndex(index) {
  const out = [];
  const take = (rows, group, hint) => {
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!row || typeof row.title !== 'string' || !row.title.trim() || !isSitePath(row.url)) continue;
      out.push({ group, title: row.title.trim(), hint: hint(row), url: row.url, words: typeof row.text === 'string' ? row.text : '' });
    }
  };
  take(index?.projects, 'Project', (r) => (typeof r.kind === 'string' ? r.kind : ''));
  take(index?.posts, 'Post', (r) => (typeof r.kind === 'string' ? r.kind : ''));
  return out;
}

const fold = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');

/**
 * True when the letters of `needle` appear in order and close together (within a few letters of slack), so "algvis"
 * finds "algovisualizer" but "hire" does not match a long title that just happens to contain h, i, r and e far apart.
 */
const isCompactSubsequence = (needle, haystack) => {
  const window = needle.length + 3;
  for (let start = haystack.indexOf(needle[0]); start !== -1; start = haystack.indexOf(needle[0], start + 1)) {
    let at = 1;
    for (let i = start + 1; i < haystack.length && i < start + window && at < needle.length; i += 1) if (haystack[i] === needle[at]) at += 1;
    if (at === needle.length) return true;
  }
  return false;
};

/** How well one typed word matches one item: 0 means it does not match at all. */
function wordScore(item, word) {
  const title = fold(item.title);
  if (title.startsWith(word)) return 100;
  if (title.split(/[^a-z0-9+#]+/).some((part) => part.startsWith(word))) return 80;
  if (title.includes(word)) return 50;
  if (fold(`${item.hint} ${item.words}`).includes(word)) return 25;
  if (word.length >= 3 && isCompactSubsequence(word, title.replace(/\s+/g, ''))) return 10; // tolerant of skipped letters: "algvis"
  return 0;
}

/**
 * The best matches first. Every typed word has to match something (so "alg vis" narrows down), ties keep the order
 * Sections, Projects, Posts and then the original order. An empty query lists everything in that order.
 */
export function rankItems(items, query, limit = 12) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const ordered = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => GROUP_ORDER[a.item.group] - GROUP_ORDER[b.item.group] || a.index - b.index);
  if (words.length === 0) return ordered.map((o) => o.item);
  return ordered
    .map((o) => {
      const scores = words.map((word) => wordScore(o.item, word));
      return { ...o, score: scores.every((s) => s > 0) ? scores.reduce((a, b) => a + b, 0) : 0 };
    })
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((o) => o.item);
}
