import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { headBlock, isOn, vercelAnalyticsSnippet, analyticsSnippet } from '../build/seo.js';

const read = (path) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
const base = { siteUrl: 'https://example.org', title: 'T', description: 'D', path: '/', image: 'https://example.org/og.png', imageAlt: 'x' };

describe('the switch', () => {
  it('reads 1, true and yes (any capitals) as on, and everything else as off', () => {
    for (const on of ['1', 'true', 'TRUE', ' yes ', 'Yes']) expect(isOn(on), on).toBe(true);
    for (const off of ['0', 'false', 'no', '', 'on', undefined, null]) expect(isOn(off), String(off)).toBe(false);
  });
});

describe('Vercel Web Analytics snippet', () => {
  it('is empty when switched off, so nothing is loaded and nothing is requested', () => {
    expect(vercelAnalyticsSnippet(false)).toBe('');
    expect(headBlock(base)).not.toContain('_vercel');
  });
  it('is a deferred script from the site’s own address when switched on', () => {
    const snippet = vercelAnalyticsSnippet(true);
    expect(snippet).toContain('<script defer src="/_vercel/insights/script.js"></script>');
    expect(snippet).not.toMatch(/https?:\/\//); // no third-party host at all
    expect(headBlock({ ...base, vercelAnalytics: true })).toContain('/_vercel/insights/script.js');
  });
  it('is added once per page, and only in the page head', () => {
    const head = headBlock({ ...base, vercelAnalytics: true });
    expect(head.match(/_vercel\/insights\/script\.js/g)).toHaveLength(1);
  });
});

describe('Google Analytics stays strictly opt-in', () => {
  it('loads nothing without a valid measurement id, and the two options are independent', () => {
    expect(analyticsSnippet('')).toBe('');
    expect(analyticsSnippet('not-an-id')).toBe('');
    expect(analyticsSnippet('G-ABCD1234')).toContain('googletagmanager.com');
    const head = headBlock({ ...base, vercelAnalytics: true });
    expect(head).not.toContain('googletagmanager');
  });
});

describe('wiring and policy', () => {
  it('the build reads the switch from the environment and never adds analytics to the admin page', () => {
    const plugin = read('build/seo-plugin.js');
    expect(plugin).toContain('vercelAnalytics: isOn(env.VITE_VERCEL_ANALYTICS)');
    expect(plugin).toMatch(/name === 'admin\.html'\) return html/);
  });
  it('the content security policy already allows a script from the site itself (no new host needed)', () => {
    const csp = JSON.parse(read('vercel.json')).headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value;
    expect(csp).toMatch(/script-src 'self'/);
    expect(csp).toMatch(/connect-src 'self'/);
  });
  it('the README explains the switch and the one step in the Vercel dashboard', () => {
    const readme = read('README.md');
    expect(readme).toContain('VITE_VERCEL_ANALYTICS');
    expect(readme).toContain('no cookies');
  });
});
