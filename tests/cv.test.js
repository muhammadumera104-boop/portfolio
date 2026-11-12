import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { cvHtml, cvProjects, CV_PATH, CV_FILE } from '../src/render/cv.js';
import { educationSection, footer } from '../src/render/sections/closing.js';
import { esc } from '../src/render/util.js';
import { cv, profile, education, skills, projects } from '../src/data/content.js';

const root = resolve(import.meta.dirname, '..');

describe('the CV page', () => {
  const html = cvHtml('https://example.org');

  it('is built from the site data: name, contact, education, skills and every case study', () => {
    expect(html).toContain(profile.name);
    expect(html).toContain(profile.email);
    for (const e of education) expect(html).toContain(esc(e.title));
    for (const s of skills) expect(html).toContain(esc(s.group));
    for (const p of projects) expect(html).toContain(esc(p.title));
    expect(html).toContain('github.com/muhammadumera104-boop');
    expect(html).toContain('example.org');
  });
  it('links every project to a real source address and keeps the case studies pointing at their own folders', () => {
    const { main } = cvProjects();
    expect(main.length).toBeGreaterThanOrEqual(5);
    for (const p of main) expect(p.url, p.title).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+/);
    expect(main.slice(0, 3).map((p) => p.url.split('/').pop())).toEqual(['edutrack', 'algovisualizer', 'allocator']);
  });
  it('leaves out Certificates and Achievements while there are none, so nothing is invented', () => {
    expect(html).not.toContain('<h2>Certificates</h2>');
    expect(html).not.toContain('<h2>Achievements</h2>');
  });
  it('is a complete, printable A4 page with escaped text', () => {
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('@page { size: A4');
    expect(html).not.toMatch(/<script/i);
  });
});

describe('the fixed PDF file', () => {
  const file = resolve(root, 'public', 'cv', CV_FILE);

  it('exists in public/cv, is a real PDF, and is small enough to download quickly', () => {
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(statSync(file).size).toBeLessThan(400 * 1024);
  });
  it('is one or two pages long (a CV, not the whole website)', () => {
    const text = readFileSync(file, 'latin1');
    const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(pages).toBeGreaterThanOrEqual(1);
    expect(pages).toBeLessThanOrEqual(2);
  });
});

describe('the download buttons', () => {
  it('point at the fixed file and download it with a proper file name', () => {
    expect(CV_PATH).toBe(cv.path);
    expect(cv.path).toBe(`/cv/${cv.file}`);
    for (const html of [educationSection(), footer()]) {
      expect(html).toContain(`href="${cv.path}" download="${cv.file}"`);
    }
    expect(educationSection()).toContain('Download CV (PDF)');
  });
  it('the old print button is still there, but no longer pretends to be the CV', () => {
    const html = educationSection();
    expect(html).toContain('data-print');
    expect(html).toContain('Print this page');
    expect(html).not.toContain('Save CV as PDF');
  });
});
