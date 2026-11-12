import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { rssXml, headBlock } from '../build/seo.js';
import { readingProgress } from '../src/shared/reading-progress.js';
import { filterPosts, relatedPosts } from '../src/shared/utils.js';
import { blogPageHtml } from '../src/render/blog.js';
import { builtInPosts } from '../src/data/posts.js';

const read = (path) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
const SITE = 'https://example.org';

const posts = [
  { slug: 'newest', title: 'Newest & <best>', category: 'Python', excerpt: 'About "quotes" & <tags>.', createdAt: '2026-11-10T10:00:00Z', tags: ['python', 'graphs'] },
  { slug: 'older', title: 'Older post', category: 'Systems', content: '<p>Some <b>body</b> text that becomes the summary.</p>', createdAt: '2026-10-01T10:00:00Z', tags: ['c'] },
  { slug: 'undated', title: 'No date', createdAt: null },
];

describe('RSS feed', () => {
  const xml = rssXml(SITE, posts, new Date('2026-11-12T00:00:00Z'));

  it('is a valid-looking RSS 2.0 document with a self link and the build date', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<atom:link href="https://example.org/rss.xml" rel="self" type="application/rss+xml"/>');
    expect(xml).toContain('<lastBuildDate>Thu, 12 Nov 2026 00:00:00 GMT</lastBuildDate>');
    expect(xml.match(/<item>/g)).toHaveLength(3);
  });
  it('gives each post its permanent link, date, category and a short summary, never the whole article', () => {
    expect(xml).toContain('<link>https://example.org/blog/newest/</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://example.org/blog/older/</guid>');
    expect(xml).toContain('<pubDate>Tue, 10 Nov 2026 10:00:00 GMT</pubDate>');
    expect(xml).toContain('<category>Python</category>');
    expect(xml).toContain('Some body text that becomes the summary.');
    expect(xml).not.toContain('<b>body</b>');
  });
  it('escapes everything, so titles with & or < can never break the XML', () => {
    expect(xml).toContain('<title>Newest &amp; &lt;best&gt;</title>');
    expect(xml).toContain('About &quot;quotes&quot; &amp; &lt;tags&gt;.');
    expect(xml).not.toMatch(/<title>[^<]*<best>/);
  });
  it('leaves out the date of a post that has none, and handles an empty blog', () => {
    const item = xml.split('<item>').find((chunk) => chunk.includes('/blog/undated/'));
    expect(item).not.toContain('<pubDate>');
    expect(rssXml(SITE, [])).toContain('<channel>');
  });
  it('lists at most 30 posts', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ slug: `p${i}`, title: `P${i}`, createdAt: '2026-01-01T00:00:00Z' }));
    expect(rssXml(SITE, many).match(/<item>/g)).toHaveLength(30);
  });
  it('every page advertises the feed in its head, so feed readers and browsers can find it', () => {
    const head = headBlock({ siteUrl: SITE, title: 'T', description: 'D', path: '/', image: `${SITE}/og.png`, imageAlt: 'x' });
    expect(head).toContain('<link rel="alternate" type="application/rss+xml"');
    expect(head).toContain('href="https://example.org/rss.xml"');
  });
  it('the build writes rss.xml, the blog page links to it, and Vercel serves it as RSS', () => {
    expect(read('build/seo-plugin.js')).toContain("'rss.xml'");
    expect(blogPageHtml([])).toContain('href="/rss.xml"');
    expect(read('vercel.json')).toContain('application/rss+xml');
  });
});

describe('reading progress', () => {
  it('is 0 before the article reaches the middle of the screen, and 1 after its end has passed it', () => {
    expect(readingProgress({ top: 800, height: 2000, viewport: 800 })).toBe(0);
    expect(readingProgress({ top: 400, height: 2000, viewport: 800 })).toBe(0);
    expect(readingProgress({ top: -3000, height: 2000, viewport: 800 })).toBe(1);
  });
  it('grows steadily while you read', () => {
    const at = (top) => readingProgress({ top, height: 2000, viewport: 800 });
    expect(at(400 - 1000)).toBeCloseTo(0.5, 5);
    expect(at(-100)).toBeLessThan(at(-500));
    expect(at(-500)).toBeLessThan(at(-1500));
  });
  it('is safe with an empty article or a zero-height window', () => {
    expect(readingProgress({ top: 0, height: 0, viewport: 800 })).toBe(0);
    expect(readingProgress({ top: 0, height: 100, viewport: 0 })).toBe(0);
    expect(readingProgress({ top: NaN, height: 100, viewport: 800 })).toBe(0);
  });
  it('is wired: the post page starts it, and the page-wide bar steps aside while a post is shown', () => {
    expect(read('src/blog/post.js')).toContain('initReadingProgress()');
    expect(read('src/scripts/nav.js')).toContain("bar.dataset.mode !== 'article'");
    expect(read('src/blog/progress.js')).toContain("querySelector('[data-prose]')");
  });
});

describe('search, tag filter and related posts', () => {
  it('search matches title, excerpt, category and tags without caring about case', () => {
    expect(filterPosts(posts, { search: 'GRAPHS' }).map((p) => p.slug)).toEqual(['newest']);
    expect(filterPosts(posts, { search: 'systems' }).map((p) => p.slug)).toEqual(['older']);
    expect(filterPosts(posts, { search: 'nothing-like-this' })).toEqual([]);
  });
  it('a tag and a category can be combined to narrow the list', () => {
    expect(filterPosts(posts, { tag: 'python' }).map((p) => p.slug)).toEqual(['newest']);
    expect(filterPosts(posts, { tag: 'python', category: 'Systems' })).toEqual([]);
    expect(filterPosts(posts, { tag: 'c', category: 'Systems' }).map((p) => p.slug)).toEqual(['older']);
  });
  it('the blog page shows a row for categories and a separate row for tags', () => {
    const code = read('src/blog/blog.js');
    expect(code).toContain("group('category', 'Category'");
    expect(code).toContain("group('tag', 'Tag'");
    expect(code).toContain('blog-tags__group');
  });
  it('related posts prefer shared tags and the same category, and never include the post itself', () => {
    const a = builtInPosts[0];
    const all = builtInPosts.map((p) => ({ ...p, id: p.slug }));
    const related = relatedPosts({ ...a, id: a.slug }, all, 3, { fill: true });
    expect(related.length).toBeGreaterThan(0);
    expect(related.map((p) => p.slug)).not.toContain(a.slug);
  });
});
