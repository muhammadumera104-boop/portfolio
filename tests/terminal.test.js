import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { themeChoice, themeUsage, blogLines, resumeLines, hireLines, eggLines } from '../src/shared/terminal-extra.js';
import { aboutSection } from '../src/render/sections/about.js';
import { cv, profile } from '../src/data/content.js';

const text = (lines) => lines.map((l) => (typeof l === 'string' ? l : `${l.text} (${l.href})`)).join('\n');

describe('theme command', () => {
  it('toggles with no word, "toggle" or "switch", and sets a named theme', () => {
    expect(themeChoice(undefined, 'light')).toBe('dark');
    expect(themeChoice('', 'dark')).toBe('light');
    expect(themeChoice('toggle', 'light')).toBe('dark');
    expect(themeChoice('switch', 'dark')).toBe('light');
    expect(themeChoice('dark', 'dark')).toBe('dark');
    expect(themeChoice('LIGHT', 'dark')).toBe('light');
  });
  it('rejects words it does not know, and has a usage line', () => {
    expect(themeChoice('purple', 'light')).toBeNull();
    expect(themeUsage()[0]).toContain('theme [dark|light|toggle]');
  });
});

describe('blog command', () => {
  const index = {
    posts: [
      { title: 'Newest post', url: '/blog/newest/', kind: 'Python' },
      { title: 'Older post', url: '/blog/older/', kind: '' },
      { title: 'Evil', url: 'https://evil.example/', kind: '' },
      { title: 'Also evil', url: '//evil.example/', kind: '' },
    ],
  };
  it('lists the latest posts as links, newest first, with a link to all of them', () => {
    const out = blogLines(index);
    expect(out[0]).toBe('Latest 2 posts:');
    expect(out[1]).toEqual({ text: 'Newest post  [Python]', href: '/blog/newest/' });
    expect(out[2]).toEqual({ text: 'Older post', href: '/blog/older/' });
    expect(out.at(-1)).toEqual({ text: 'All posts →', href: '/blog/' });
  });
  it('never links off the site, and limits the list', () => {
    expect(text(blogLines(index))).not.toContain('evil.example');
    const many = { posts: Array.from({ length: 9 }, (_, i) => ({ title: `P${i}`, url: `/blog/p${i}/` })) };
    expect(blogLines(many, 3)).toHaveLength(5); // heading + 3 posts + "all posts"
  });
  it('falls back to a link to the blog when there is no index', () => {
    for (const bad of [null, undefined, {}, { posts: 'no' }, { posts: [] }]) expect(blogLines(bad)).toEqual([{ text: 'Open the blog →', href: '/blog/' }]);
  });
});

describe('resume and hire commands', () => {
  it('resume links to the fixed CV file', () => {
    expect(resumeLines()).toContainEqual({ text: `Download ${cv.file}`, href: cv.path });
  });
  it('hire gives the email, the profiles, the CV and the projects in one place', () => {
    const out = text(hireLines());
    expect(out).toContain(profile.email);
    expect(out).toContain('github.com/muhammadumera104-boop');
    expect(out).toContain('linkedin.com/in/');
    expect(out).toContain(cv.path);
    expect(out).toContain('/#projects');
    expect(out).toContain('internships');
  });
});

describe('the hidden easter egg', () => {
  it('"sudo hire umer" has a happy ending that still points to the email', () => {
    const out = text(eggLines(['hire', 'umer']));
    expect(out).toContain('Access granted');
    expect(out).toContain(`mailto:${profile.email}`);
    expect(text(eggLines(['HIRE', 'ME']))).toContain('Access granted');
  });
  it('any other sudo gets the classic reply and a hint', () => {
    for (const args of [[], ['rm', '-rf', '/'], ['hire']]) {
      const out = text(eggLines(args));
      expect(out).toContain('not in the sudoers file');
      expect(out).toContain('sudo hire umer');
    }
  });
  it('is not listed anywhere a visitor would look: not in the command table, so not in help or tab completion', () => {
    const code = readFileSync(resolve(import.meta.dirname, '../src/scripts/terminal.js'), 'utf8');
    expect(code).toMatch(/if \(name === 'sudo'\) result = eggLines/);
    expect(code).not.toMatch(/^\s+sudo: \{/m);
    expect(aboutSection()).not.toContain('sudo');
  });
});

describe('console wiring', () => {
  const code = readFileSync(resolve(import.meta.dirname, '../src/scripts/terminal.js'), 'utf8');

  it('registers the four new commands next to the old ones, and keeps the old ones', () => {
    for (const name of ['blog', 'resume', 'hire', 'theme', 'whoami', 'skills', 'projects', 'contact', 'github', 'linkedin', 'clear', 'help']) {
      expect(code, name).toMatch(new RegExp(`^  ${name}: \\{`, 'm'));
    }
  });
  it('the quick buttons include hire', () => {
    expect(aboutSection()).toContain('data-command="hire"');
  });
});
