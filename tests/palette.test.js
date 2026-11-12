import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { rankItems, sectionItems, builtInProjectItems, itemsFromIndex, searchIndex, isSitePath } from '../src/shared/palette.js';
import { header } from '../src/render/sections/header.js';
import { shellHtml } from '../src/render/shell.js';
import { render } from '../src/render/index.js';
import { nav } from '../src/data/content.js';

const items = [
  { group: 'Section', title: 'About', hint: '', url: '/#about', words: 'who me bio' },
  { group: 'Section', title: 'Contact', hint: '', url: '/#contact', words: 'email message hire' },
  { group: 'Project', title: 'AlgoVisualizer & Pathfinding Engine', hint: 'Python · Algorithms', url: '/projects/algovisualizer/', words: '' },
  { group: 'Project', title: 'Custom Memory Allocator & DS Toolkit', hint: 'C · Systems', url: '/projects/allocator/', words: '' },
  { group: 'Post', title: 'How Dijkstra explores a grid', hint: 'Python', url: '/blog/dijkstra/', words: 'shortest path graph search' },
];
const titles = (list) => list.map((i) => i.title);

describe('rankItems', () => {
  it('an empty query lists everything: sections first, then projects, then posts', () => {
    expect(rankItems(items, '').map((i) => i.group)).toEqual(['Section', 'Section', 'Project', 'Project', 'Post']);
    expect(rankItems(items, '   ')).toHaveLength(5);
  });
  it('ranks a title that starts with the word above one that merely contains it', () => {
    expect(titles(rankItems(items, 'about'))[0]).toBe('About');
    expect(titles(rankItems(items, 'alloc'))[0]).toBe('Custom Memory Allocator & DS Toolkit');
  });
  it('matches the start of any word in the title, ignores case and accents', () => {
    expect(titles(rankItems(items, 'PATHF'))).toContain('AlgoVisualizer & Pathfinding Engine');
    expect(titles(rankItems(items, 'memory'))).toEqual(['Custom Memory Allocator & DS Toolkit']);
    expect(titles(rankItems([{ group: 'Post', title: 'Café notes', hint: '', url: '/a/', words: '' }], 'cafe'))).toEqual(['Café notes']);
  });
  it('also searches the hint and the extra words, but ranks those below title matches', () => {
    expect(titles(rankItems(items, 'hire'))).toEqual(['Contact']);
    expect(titles(rankItems(items, 'python'))).toEqual(['AlgoVisualizer & Pathfinding Engine', 'How Dijkstra explores a grid']);
    expect(titles(rankItems(items, 'graph'))[0]).toBe('How Dijkstra explores a grid');
  });
  it('every typed word has to match, so more words narrow the list', () => {
    expect(titles(rankItems(items, 'algo path'))).toEqual(['AlgoVisualizer & Pathfinding Engine']);
    expect(rankItems(items, 'algo zzz')).toEqual([]);
  });
  it('forgives skipped letters in longer words', () => {
    expect(titles(rankItems(items, 'algvis'))).toEqual(['AlgoVisualizer & Pathfinding Engine']);
    expect(rankItems(items, 'xq')).toEqual([]);
  });
  it('limits the number of results and does not change the input', () => {
    const copy = JSON.stringify(items);
    expect(rankItems(items, 'o', 2)).toHaveLength(2);
    expect(JSON.stringify(items)).toBe(copy);
  });
  it('treats regex characters as plain text', () => {
    expect(() => rankItems(items, '.*(')).not.toThrow();
    expect(rankItems(items, 'c++')).toEqual([]);
  });
});

describe('what can be found', () => {
  it('has a section item for every item of the main navigation, with working absolute addresses', () => {
    const sections = sectionItems();
    for (const n of nav) expect(sections.some((s) => s.title === n.label), n.label).toBe(true);
    for (const s of sections) expect(isSitePath(s.url), s.url).toBe(true);
    expect(sections.find((s) => s.title === 'About').url).toBe('/#about');
    expect(sections.find((s) => s.title === 'Blog').url).toBe('/blog/');
  });
  it('lists the projects that ship with the site, including the three case studies', () => {
    const projects = builtInProjectItems();
    expect(projects.length).toBeGreaterThanOrEqual(9);
    expect(projects.map((p) => p.url)).toEqual(expect.arrayContaining(['/projects/edutrack/', '/projects/algovisualizer/', '/projects/allocator/']));
    expect(projects.every((p) => p.group === 'Project')).toBe(true);
  });
  it('finds the case studies by what people would type', () => {
    const all = [...sectionItems(), ...builtInProjectItems()];
    expect(rankItems(all, 'edutrack')[0].url).toBe('/projects/edutrack/');
    expect(rankItems(all, 'allocator')[0].url).toBe('/projects/allocator/');
    expect(rankItems(all, 'contact')[0].url).toBe('/#contact');
    expect(rankItems(all, 'university')[0].title).toBe('Education');
  });
});

describe('the search index written by the build', () => {
  const index = searchIndex({
    projects: [{ title: 'Quizora', slug: 'quizora', category: 'JavaScript' }],
    posts: [{ title: 'A post', slug: 'a-post', category: 'Python', excerpt: `${'word '.repeat(80)}` }],
  });
  it('lists addresses and short text only, never article content', () => {
    expect(index.v).toBe(1);
    expect(index.projects).toEqual([{ title: 'Quizora', url: '/projects/quizora/', kind: 'JavaScript' }]);
    expect(index.posts[0].url).toBe('/blog/a-post/');
    expect(index.posts[0].text.length).toBeLessThanOrEqual(140);
  });
  it('is empty-safe', () => {
    expect(searchIndex()).toEqual({ v: 1, projects: [], posts: [] });
  });
  it('becomes palette items, and the round trip keeps titles and addresses', () => {
    const back = itemsFromIndex(JSON.parse(JSON.stringify(index)));
    expect(back.map((i) => [i.group, i.title, i.url])).toEqual([['Project', 'Quizora', '/projects/quizora/'], ['Post', 'A post', '/blog/a-post/']]);
  });
  it('ignores malformed rows and anything that points off the site', () => {
    const bad = itemsFromIndex({
      projects: [{ title: 'Evil', url: 'https://evil.example/' }, { title: 'Also evil', url: '//evil.example/x' }, { title: 'Script', url: 'javascript:alert(1)' }, { title: '', url: '/ok/' }, null, 7],
      posts: [{ title: 'Good', url: '/blog/good/' }],
    });
    expect(bad.map((i) => i.title)).toEqual(['Good']);
    expect(itemsFromIndex(null)).toEqual([]);
    expect(itemsFromIndex({ projects: 'nope', posts: {} })).toEqual([]);
  });
  it('isSitePath accepts only same-site paths', () => {
    for (const ok of ['/', '/blog/', '/#about', '/projects/a/']) expect(isSitePath(ok), ok).toBe(true);
    for (const bad of ['', 'blog', '//x.example', 'https://x.example', 'javascript:alert(1)', '/a b', null, undefined]) expect(isSitePath(bad), String(bad)).toBe(false);
  });
});

describe('the search button', () => {
  it('is in the header of the home page and of every sub-page, with an accessible name and the shortcut announced', () => {
    for (const html of [header(), header('/', ''), shellHtml(), render()]) {
      expect(html).toContain('data-palette-open');
      expect(html).toContain('aria-label="Search the site"');
      expect(html).toContain('aria-keyshortcuts="Control+K Meta+K"');
      expect(html).toContain('data-palette-hint');
    }
  });
  it('the shortcut hint is hidden from screen readers (the button already has a name)', () => {
    expect(header()).toMatch(/<kbd class="palette-open__hint" data-palette-hint aria-hidden="true">/);
  });
});

describe('wiring', () => {
  const read = (path) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');

  it('the palette starts on the home page and on the sub-pages', () => {
    expect(read('src/main.js')).toContain('initPalette');
    expect(read('src/blog/shell.js')).toContain('initPalette');
  });
  it('the build writes the index next to the sitemap', () => {
    expect(read('build/seo-plugin.js')).toContain('search-index.json');
  });
  it('the dialog script follows the combobox pattern and only uses site-relative fetches', () => {
    const code = read('src/scripts/palette.js');
    for (const needle of ['role="combobox"', 'role="listbox"', 'role="option"', 'aria-activedescendant', 'aria-selected', "fetch(INDEX_URL", "const INDEX_URL = '/search-index.json'"]) {
      expect(code, needle).toContain(needle);
    }
  });
});
