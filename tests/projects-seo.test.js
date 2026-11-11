import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectPageHtml } from '../src/render/project.js';
import { latestPostsHtml, postCard } from '../src/render/blog.js';
import { notFoundHtml } from '../src/render/shell.js';
import { projectSchema } from '../src/shared/schemas.js';
import { projectJsonLd, homeJsonLd, projectPath } from '../src/shared/seo.js';
import { headBlock, analyticsSnippet } from '../build/seo.js';
import { fetchProjects } from '../build/firestore-rest.js';
import { webProjects, withBuiltInProjectDefaults } from '../src/data/content.js';
import { builtInPosts } from '../src/data/posts.js';
import { parseScreenshotLines, formatScreenshotLines, parseChallengeLines, formatChallengeLines } from '../src/shared/media.js';

const SITE = 'https://example.com';
const full = {
  slug: 'demo-app', title: 'Demo <App>', kind: 'JS · CSS', category: 'Web', status: 'Demo project',
  summary: 'A demo application.', problem: 'Solve a problem.', features: ['Fast', 'Accessible'],
  process: 'Planned it.\n\nBuilt it.', challenges: [{ challenge: 'State bugs', solution: 'Single render function' }],
  details: ['Uses plain objects'], outcome: 'It works.', techStack: ['JavaScript', 'CSS'],
  imageUrl: 'images/projects/quizora.webp', liveUrl: 'demos/quizora.html', githubUrl: 'https://github.com/x/y',
  screenshots: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/a.png', alt: 'Home screen' }],
  demoVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

describe('projectPageHtml', () => {
  const html = projectPageHtml(full, { others: [{ slug: 'other', title: 'Other', kind: 'Web' }] });

  it('has one h1 and every section the brief asks for', () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    for (const heading of ['The problem', 'Key features', 'Development process', 'Challenges and lessons', 'How it is built', 'Screenshots', 'Outcome', 'Technologies', 'Demo video', 'More projects']) {
      expect(html, heading).toContain(heading);
    }
  });
  it('escapes the title and renders breadcrumbs with links back to home and projects', () => {
    expect(html).toContain('<h1 id="project-title" class="project-page__title">Demo &lt;App&gt;</h1>');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/#projects"');
  });
  it('gives every screenshot alt text and an optimised, linked image', () => {
    expect(html).toContain('alt="Home screen"');
    expect(html).toContain('c_limit,w_800,q_auto,f_auto');
    expect(html).toContain('target="_blank"');
  });
  it('links the live demo (a local demo stays on this site) and GitHub in a new tab', () => {
    expect(html).toContain('href="/demos/quizora.html"');
    expect(html).toContain('Open the demo');
    expect(html).toContain('https://github.com/x/y');
    expect(html).toContain('rel="noopener noreferrer"');
  });
  it('turns blank lines in the process into paragraphs and lists features', () => {
    expect(html).toContain('Planned it.</p><p>Built it.');
    expect(html).toContain('<li>Fast</li>');
  });
  it('embeds the demo video with click-to-play data', () => {
    expect(html).toContain('data-video-embed="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
  it('leaves out sections that have no content instead of showing placeholders', () => {
    const bare = projectPageHtml({ slug: 'bare', title: 'Bare', summary: 'Just a summary.' });
    for (const heading of ['Key features', 'Development process', 'Challenges and lessons', 'Screenshots', 'Outcome', 'Demo video', 'More projects', 'The problem']) {
      expect(bare, heading).not.toContain(heading);
    }
    expect(bare).toContain('Live demo not published');
    expect(bare).toContain('Want to talk about this project?');
  });
  it('ignores an unusable demo video link', () => {
    expect(projectPageHtml({ ...full, demoVideo: 'https://evil.example/x' })).not.toContain('Demo video');
  });
});

describe('project data', () => {
  it('every built-in project passes the schema and has key features taken from its description', () => {
    for (const p of webProjects) {
      const result = projectSchema.safeParse(p);
      expect(result.success, `${p.slug}: ${result.success ? '' : JSON.stringify(result.error.issues)}`).toBe(true);
      expect(p.features.length, p.slug).toBeGreaterThan(0);
    }
  });
  it('every project thumbnail exists in public/', () => {
    for (const p of webProjects) expect(existsSync(resolve(import.meta.dirname, '../public', p.imageUrl)), p.imageUrl).toBe(true);
  });
  it('requires alt text for screenshots and a valid video link', () => {
    const ok = (extra) => projectSchema.safeParse({ ...webProjects[0], ...extra }).success;
    expect(ok({ screenshots: [{ url: 'https://example.com/a.png', alt: 'A screenshot of the home page' }] })).toBe(true);
    expect(ok({ screenshots: [{ url: 'https://example.com/a.png', alt: '' }] })).toBe(false);
    expect(ok({ screenshots: [{ url: '', alt: 'Missing address' }] })).toBe(false);
    expect(ok({ demoVideo: 'https://vimeo.com/123456789' })).toBe(true);
    expect(ok({ demoVideo: '' })).toBe(true);
    expect(ok({ demoVideo: 'javascript:alert(1)' })).toBe(false);
    expect(ok({ challenges: [{ challenge: 'x', solution: '' }] })).toBe(false);
  });
  it('withBuiltInProjectDefaults fills missing features but never overrides the dashboard', () => {
    expect(withBuiltInProjectDefaults({ slug: 'mediqueue' }).features.length).toBeGreaterThan(0);
    expect(withBuiltInProjectDefaults({ slug: 'mediqueue', features: ['Mine'] }).features).toEqual(['Mine']);
    const custom = { slug: 'brand-new' };
    expect(withBuiltInProjectDefaults(custom)).toBe(custom);
  });
  it('parses and formats screenshot and challenge lines', () => {
    expect(parseScreenshotLines('https://x.co/a.png | Home screen\nhttps://x.co/b.png')).toEqual([
      { url: 'https://x.co/a.png', alt: 'Home screen' }, { url: 'https://x.co/b.png', alt: '' },
    ]);
    expect(formatScreenshotLines([{ url: 'https://x.co/a.png', alt: 'Home screen' }])).toBe('https://x.co/a.png | Home screen');
    expect(parseChallengeLines('Slow | Cache it\nBug | Fix it')).toEqual([{ challenge: 'Slow', solution: 'Cache it' }, { challenge: 'Bug', solution: 'Fix it' }]);
    expect(formatChallengeLines([{ challenge: 'Slow', solution: 'Cache it' }])).toBe('Slow | Cache it');
  });
});

describe('structured data for projects and the home page', () => {
  it('a project with a live site is a SoftwareApplication, with breadcrumbs through Projects', () => {
    const [main, crumbs] = projectJsonLd({ siteUrl: SITE, project: full, description: 'd' })['@graph'];
    expect(main['@type']).toBe('SoftwareApplication');
    expect(main.installUrl).toBe('https://example.com/demos/quizora.html');
    expect(main.url).toBe('https://example.com/projects/demo-app/');
    expect(main.image).toContain('/images/projects/quizora.webp');
    expect(main.sameAs).toEqual(['https://github.com/x/y']);
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(['Home', 'Projects', 'Demo <App>']);
  });
  it('a project without a live site is a CreativeWork', () => {
    expect(projectJsonLd({ siteUrl: SITE, project: { ...full, liveUrl: '' }, description: 'd' })['@graph'][0]['@type']).toBe('CreativeWork');
  });
  it('the home page lists its projects as an ItemList', () => {
    const graph = homeJsonLd(SITE, { projects: [{ name: 'A', url: '/#project-a' }, { name: 'B', url: projectPath('b') }] })['@graph'];
    const list = graph.find((n) => n['@type'] === 'ItemList');
    expect(list.itemListElement.map((i) => i.url)).toEqual(['https://example.com/#project-a', 'https://example.com/projects/b/']);
  });
});

describe('analytics, Bing and noindex', () => {
  it('adds Google Analytics 4 with IP anonymisation only for a valid measurement id', () => {
    expect(analyticsSnippet('G-ABCD1234')).toContain('googletagmanager.com/gtag/js?id=G-ABCD1234');
    expect(analyticsSnippet('G-ABCD1234')).toContain('anonymize_ip:true');
    for (const bad of ['', undefined, 'UA-1234-1', 'G-', "G-X'];alert(1);//", 'g-abcd1234']) expect(analyticsSnippet(bad), String(bad)).toBe('');
  });
  it('adds the Bing and Google verification tags and analytics to the head when configured', () => {
    const html = headBlock({ siteUrl: SITE, title: 'T', description: 'D', path: '/', bing: 'BING123', verification: 'GOOG456', analyticsId: 'G-ABCD1234' });
    expect(html).toContain('<meta name="msvalidate.01" content="BING123">');
    expect(html).toContain('<meta name="google-site-verification" content="GOOG456">');
    expect(html).toContain('gtag(');
    const plain = headBlock({ siteUrl: SITE, title: 'T', description: 'D', path: '/' });
    expect(plain).not.toContain('msvalidate');
    expect(plain).not.toContain('gtag');
  });
  it('a noindex robots value reaches the page (used by the 404 page)', () => {
    expect(headBlock({ siteUrl: SITE, title: 'T', description: 'D', path: '/', robots: 'noindex, follow' })).toContain('<meta name="robots" content="noindex, follow">');
  });
});

describe('home page and 404', () => {
  it('shows the latest posts as h3 cards with a link to all posts, and nothing when there are no posts', () => {
    const html = latestPostsHtml(builtInPosts.slice(0, 3));
    expect(html.match(/class="post-card"/g)).toHaveLength(3);
    expect(html).toContain('<h3 class="post-card__title">');
    expect(html).toContain('href="/blog/"');
    expect(latestPostsHtml([])).toBe('');
    expect(postCard(builtInPosts[0])).toContain('<h2 class="post-card__title">');
  });
  it('the 404 page explains the problem and links back to home, blog, projects and contact', () => {
    const html = notFoundHtml();
    expect(html).toContain('<h1');
    for (const href of ['href="/"', 'href="/blog/"', 'href="/#projects"', 'href="/#contact"']) expect(html).toContain(href);
  });
});

describe('fetchProjects', () => {
  it('reads the projects collection without a published filter', async () => {
    let body;
    const fetchImpl = async (_url, init) => {
      body = JSON.parse(init.body);
      return { ok: true, json: async () => [{ document: { name: 'p/databases/(default)/documents/projects/a', fields: { slug: { stringValue: 'a' }, features: { arrayValue: { values: [{ stringValue: 'F' }] } } } } }] };
    };
    const projects = await fetchProjects('p', { fetchImpl });
    expect(body.structuredQuery.from).toEqual([{ collectionId: 'projects' }]);
    expect(body.structuredQuery.where).toBeUndefined();
    expect(projects).toEqual([{ id: 'a', slug: 'a', features: ['F'], updatedAt: undefined }]);
  });
});
