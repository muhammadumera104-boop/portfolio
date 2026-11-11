import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectPageHtml } from '../src/render/project.js';
import { projectsSection } from '../src/render/sections/projects.js';
import { repoUrl } from '../src/shared/utils.js';
import { projectSchema } from '../src/shared/schemas.js';
import { projectJsonLd } from '../src/shared/seo.js';
import { projects } from '../src/data/content.js';
import { buildSeed } from '../src/data/seed.js';

describe('repoUrl: only a real repository counts as source code', () => {
  it('accepts github.com/<user>/<repo> and rejects a profile, empty or unsafe values', () => {
    expect(repoUrl('https://github.com/muhammadumera104-boop/portfolio')).toBe('https://github.com/muhammadumera104-boop/portfolio');
    expect(repoUrl('https://github.com/muhammadumera104-boop')).toBe('');
    expect(repoUrl('https://github.com/muhammadumera104-boop/')).toBe('');
    expect(repoUrl('')).toBe('');
    expect(repoUrl(undefined)).toBe('');
    expect(repoUrl('javascript:alert(1)')).toBe('');
    expect(repoUrl('http://github.com/a/b')).toBe('');
  });
});

describe('case studies', () => {
  it('no case study links to the GitHub profile any more', () => {
    for (const p of projects) expect(p.repo === '' || repoUrl(p.repo) === p.repo, p.id).toBe(true);
    const html = projectsSection();
    expect(html).not.toContain('GitHub profile');
    expect(html).not.toContain('href="https://github.com/muhammadumera104-boop"');
  });
  it('each one links to its own project page and to its own source folder, never to the profile', () => {
    const html = projectsSection();
    for (const p of projects) {
      expect(html).toContain(`href="/projects/${p.id}/"`);
      expect(p.repo).toBe(`https://github.com/muhammadumera104-boop/portfolio/tree/main/case-studies/${p.id}`);
      expect(html).toContain(`href="${p.repo}"`);
    }
    expect(html).toContain('Source code');
    expect(html).not.toContain('Source code not published');
  });
  it('the source folder each link points to really exists and has a README and tests', () => {
    const root = resolve(import.meta.dirname, '../case-studies');
    for (const p of projects) {
      expect(existsSync(resolve(root, p.id, 'README.md')), `${p.id} README`).toBe(true);
    }
    expect(existsSync(resolve(root, 'edutrack/tests.cpp'))).toBe(true);
    expect(existsSync(resolve(root, 'algovisualizer/test_algorithms.py'))).toBe(true);
    expect(existsSync(resolve(root, 'allocator/tests.c'))).toBe(true);
  });
  it('the project page shows a "View source" link as soon as a real repository is set', () => {
    const withRepo = { slug: 'edutrack', title: 'EduTrack', summary: 'x', githubUrl: 'https://github.com/someone/edutrack' };
    expect(projectPageHtml(withRepo)).toContain('View source on GitHub');
  });
  it('the project page and structured data ignore a stale profile link stored in the database', () => {
    const stale = { slug: 'edutrack', title: 'EduTrack', summary: 'x', githubUrl: 'https://github.com/muhammadumera104-boop' };
    expect(projectPageHtml(stale)).not.toContain('View source on GitHub');
    expect(JSON.stringify(projectJsonLd({ siteUrl: 'https://example.com', project: stale, description: 'd' }))).not.toContain('muhammadumera104-boop');
  });
});

describe('challenges and lessons', () => {
  const base = { slug: 's', title: 'T', summary: 'x' };

  it('shows challenges with their solutions, then the lessons', () => {
    const html = projectPageHtml({ ...base, challenges: [{ challenge: 'Dangling pointer', solution: 'Set it to NULL after free' }], lessons: ['Ownership must be clear', 'Test the edge cases <first>'] });
    expect(html).toContain('Challenges and lessons');
    expect(html).toContain('Dangling pointer');
    expect(html).toContain('What I learned');
    expect(html).toContain('Test the edge cases &lt;first&gt;');
  });
  it('shows lessons alone, and hides the whole section when both are empty', () => {
    expect(projectPageHtml({ ...base, lessons: ['One lesson'] })).toContain('Challenges and lessons');
    expect(projectPageHtml(base)).not.toContain('Challenges and lessons');
    expect(projectPageHtml(base)).not.toContain('What I learned');
  });
  it('lessons are validated by the project schema (max 8, each non-empty)', () => {
    const valid = { title: 'Project', slug: 'project', category: 'Web', kind: 'JS', status: 'Demo', summary: 'A summary of the project.' };
    const ok = projectSchema.safeParse({ ...valid, lessons: ['a lesson'] });
    expect(ok.success, ok.success ? '' : JSON.stringify(ok.error.issues)).toBe(true);
    const tooMany = projectSchema.safeParse({ ...valid, lessons: Array(9).fill('x') });
    expect(tooMany.success).toBe(false);
  });
  it('the seed carries the real screenshots, challenges, lessons and process of every case study', () => {
    for (const { id, data } of buildSeed().projects.filter((p) => projects.some((c) => c.id === p.id))) {
      expect(data.screenshots.length, `${id} screenshots`).toBeGreaterThanOrEqual(2);
      expect(data.challenges.length, `${id} challenges`).toBeGreaterThanOrEqual(3);
      expect(data.lessons.length, `${id} lessons`).toBeGreaterThanOrEqual(3);
      expect(data.process, `${id} process`).toContain('AI assistance');
    }
  });
  it('every screenshot file exists in public/ and has real alt text', () => {
    for (const p of projects) {
      for (const shot of p.screenshots) {
        expect(existsSync(resolve(import.meta.dirname, '../public', shot.url)), shot.url).toBe(true);
        expect(shot.alt.length).toBeGreaterThan(30);
        expect(shot.alt.length).toBeLessThanOrEqual(160);
      }
    }
    expect(projects[1].screenshots[0].url.endsWith('.gif')).toBe(true); // the animated one
  });
  it('each case study page shows the gallery, challenges, lessons and process, and the source link', () => {
    for (const { id, data } of buildSeed().projects.filter((p) => projects.some((c) => c.id === p.id))) {
      const html = projectPageHtml(data);
      for (const heading of ['Challenges and lessons', 'What I learned', 'Screenshots', 'Development process']) expect(html, `${id}: ${heading}`).toContain(heading);
      expect(html.match(/<figure class="shots__item"/g)).toHaveLength(data.screenshots.length);
      expect(html).toContain('View source on GitHub');
    }
  });
});

describe('screenshot and GIF gallery', () => {
  it('renders animated GIFs from the site or Cloudinary as normal linked images with alt text', () => {
    const html = projectPageHtml({ slug: 's', title: 'T', summary: 'x', screenshots: [{ url: 'images/projects/demo.gif', alt: 'Dragging a node in the graph' }, { url: 'https://res.cloudinary.com/demo/image/upload/v1/run.gif', alt: 'Running the search' }] });
    expect(html).toContain('Screenshots');
    expect(html).toContain('/images/projects/demo.gif');
    expect(html).toContain('alt="Dragging a node in the graph"');
    expect(html).toContain('res.cloudinary.com/demo/image/upload/');
  });
});
