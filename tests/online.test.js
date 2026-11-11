import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { onlineSection } from '../src/render/sections/online.js';
import { featuredRepos, links } from '../src/data/content.js';

const OWNER = 'https://github.com/muhammadumera104-boop/';

describe('featured GitHub repositories', () => {
  const html = onlineSection();

  it('shows each repository as a picture card that is one link to the repository, opening in a new tab', () => {
    expect(html.match(/class="repo-card"/g)).toHaveLength(featuredRepos.length);
    for (const repo of featuredRepos) {
      expect(html).toContain(`<a class="repo-card" href="${repo.url}" target="_blank" rel="noopener noreferrer">`);
    }
  });
  it('only links to repositories of the owner on GitHub over https', () => {
    for (const repo of featuredRepos) {
      expect(repo.url.startsWith(OWNER), repo.name).toBe(true);
      expect(repo.url.endsWith(`/${repo.name}`), repo.name).toBe(true);
    }
  });
  it('every card has a picture that exists, with real dimensions and descriptive alt text', () => {
    for (const repo of featuredRepos) {
      expect(existsSync(resolve(import.meta.dirname, '../public', repo.image)), repo.image).toBe(true);
      expect(repo.alt.length, repo.name).toBeGreaterThan(10);
      expect(html).toContain(`alt="${repo.alt}"`);
    }
    expect(html.match(/width="960" height="600"/g)).toHaveLength(featuredRepos.length);
  });
  it('has the flagship GU TECH learning management system first', () => {
    expect(featuredRepos[0].name).toBe('university-portal');
    expect(featuredRepos[0].title).toContain('GU TECH');
  });
  it('escapes text coming from the data', () => {
    expect(html).not.toMatch(/<script/i);
  });
});

describe('LinkedIn and GitHub profile links', () => {
  const html = onlineSection();
  const linkedin = links.find((l) => l.label === 'LinkedIn').href;
  const github = links.find((l) => l.label === 'GitHub').href;

  it('has a profile card that opens the LinkedIn profile in a new tab, and a button for all repositories', () => {
    expect(html).toContain(`<a class="profile-card" href="${linkedin}" target="_blank" rel="noopener noreferrer me">`);
    expect(html).toContain(`href="${github}" target="_blank" rel="noopener noreferrer me"`);
  });
  it('shows the owner name and GU TECH, with a decorative photo', () => {
    expect(html).toContain('Muhammad Umer Rizwan');
    expect(html).toContain('GU TECH, Karachi');
    expect(html).toContain('class="profile-card__photo"');
  });
  it('has one h2 and says where it goes in each link for screen readers', () => {
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html.match(/opens in a new tab/g).length).toBeGreaterThanOrEqual(featuredRepos.length + 2);
  });
});
