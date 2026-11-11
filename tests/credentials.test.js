import { describe, it, expect } from 'vitest';
import { cleanCertificates, cleanAchievements, validDate, formatDate } from '../src/shared/credentials.js';
import { certificatesSection } from '../src/render/sections/certificates.js';
import { render } from '../src/render/index.js';
import { certificates, achievements } from '../src/data/content.js';

const cert = { title: 'Sample Course', issuer: 'Sample Academy', date: '2025-03', url: 'https://example.org/verify/1' };
const win = { title: 'Sample contest', detail: 'A sentence about what happened.', date: '2026-01', url: '' };

describe('dates', () => {
  it('accepts year-month or year, and rejects everything else', () => {
    expect(validDate('2025-03')).toBe('2025-03');
    expect(validDate('2025')).toBe('2025');
    expect(validDate(' 2025-12 ')).toBe('2025-12');
    for (const bad of ['2025-13', '2025-00', '25-03', 'March 2025', '1999', '2101', '', null, undefined]) expect(validDate(bad), String(bad)).toBe('');
  });
  it('formats them for people to read', () => {
    expect(formatDate('2025-03')).toBe('Mar 2025');
    expect(formatDate('2026-12')).toBe('Dec 2026');
    expect(formatDate('2025')).toBe('2025');
    expect(formatDate('nonsense')).toBe('');
  });
});

describe('cleanCertificates', () => {
  it('keeps complete entries and treats the link as optional', () => {
    expect(cleanCertificates([cert, { ...cert, title: 'No link', url: '' }])).toHaveLength(2);
  });
  it('drops entries without a title, issuer or valid date, and any link that is not https', () => {
    expect(cleanCertificates([{ ...cert, title: '' }, { ...cert, issuer: '' }, { ...cert, date: 'soon' }, null, 'x'])).toEqual([]);
    expect(cleanCertificates([{ ...cert, url: 'http://insecure.example.org' }])[0].url).toBe('');
    expect(cleanCertificates([{ ...cert, url: 'javascript:alert(1)' }])[0].url).toBe('');
  });
  it('sorts newest first and shows at most twelve', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ ...cert, title: `Course ${i}`, date: `20${String(10 + i)}` }));
    const result = cleanCertificates(many);
    expect(result).toHaveLength(12);
    expect(result[0].date).toBe('2024');
    expect(cleanCertificates([{ ...cert, date: '2024-01' }, { ...cert, date: '2025-06' }, { ...cert, date: '2025' }]).map((c) => c.date)).toEqual(['2025-06', '2025', '2024-01']);
  });
  it('is safe with the wrong type', () => {
    expect(cleanCertificates(undefined)).toEqual([]);
    expect(cleanCertificates('no')).toEqual([]);
  });
});

describe('cleanAchievements', () => {
  it('needs a title, a detail of at least ten characters and a date', () => {
    expect(cleanAchievements([win])).toHaveLength(1);
    expect(cleanAchievements([{ ...win, detail: 'Too short' }, { ...win, title: '' }, { ...win, date: '' }])).toEqual([]);
  });
});

describe('certificatesSection', () => {
  it('is left out completely when both lists are empty, and the real data ships no placeholders', () => {
    expect(certificatesSection([], [])).toBe('');
    expect(certificatesSection([{ ...cert, date: 'x' }], [])).toBe('');
    expect(cleanCertificates(certificates)).toHaveLength(Math.min(certificates.length, 12));
    expect(cleanAchievements(achievements)).toHaveLength(Math.min(achievements.length, 12));
    expect(JSON.stringify([certificates, achievements])).not.toMatch(/lorem|sample|example\.org/i);
  });
  it('renders certificates with dates, issuers and a verification link that opens in a new tab', () => {
    const html = certificatesSection([cert], []);
    expect(html).toContain('id="certificates"');
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain('<time datetime="2025-03">Mar 2025</time>');
    expect(html).toContain('Sample Academy');
    expect(html).toContain('href="https://example.org/verify/1" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('Certificates');
    expect(html).not.toContain('Achievements'); // an empty group is left out
  });
  it('shows both groups when both have entries, and no link when none was given', () => {
    const html = certificatesSection([cert], [win]);
    expect(html).toContain('Certificates');
    expect(html).toContain('Achievements');
    expect(html).toContain('A sentence about what happened.');
    expect(html.match(/<a /g)).toHaveLength(1); // only the certificate has a link
  });
  it('escapes pasted text', () => {
    const html = certificatesSection([{ ...cert, title: 'Evil <script>alert(1)</script> course' }], []);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('home page', () => {
  it('has no certificates section while the lists are empty, and every other section is still there', () => {
    const page = render();
    if (cleanCertificates(certificates).length + cleanAchievements(achievements).length === 0) expect(page).not.toContain('id="certificates"');
    for (const id of ['about', 'skills', 'journey', 'projects', 'education', 'contact']) expect(page).toContain(`id="${id}"`);
  });
});
