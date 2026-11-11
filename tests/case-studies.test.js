import { describe, it, expect } from 'vitest';
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
  it('each one links to its own project page and says honestly when the source is not published', () => {
    const html = projectsSection();
    for (const p of projects) expect(html).toContain(`href="/projects/${p.id}/"`);
    expect(html).toContain('Source code not published');
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
  it('the seed carries screenshots, challenges and lessons for the case studies (empty until real ones are added)', () => {
    const seeded = buildSeed().projects.find((p) => p.id === 'edutrack').data;
    expect(seeded.screenshots).toEqual([]);
    expect(seeded.challenges).toEqual([]);
    expect(seeded.lessons).toEqual([]);
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
