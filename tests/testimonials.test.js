import { describe, it, expect } from 'vitest';
import { cleanTestimonials, safeHttpsUrl } from '../src/shared/testimonials.js';
import { testimonialsSection } from '../src/render/sections/testimonials.js';
import { render } from '../src/render/index.js';
import { testimonials } from '../src/data/content.js';

const good = {
  quote: 'Umer explains what he builds clearly and always tests his code before showing it.',
  name: 'Sample Person',
  role: 'Lecturer, Sample University',
  url: 'https://www.linkedin.com/in/sample-person',
};

describe('safeHttpsUrl', () => {
  it('accepts https links only', () => {
    expect(safeHttpsUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeHttpsUrl('  https://example.com  ')).toBe('https://example.com/');
    expect(safeHttpsUrl('http://example.com')).toBe('');
    expect(safeHttpsUrl('javascript:alert(1)')).toBe('');
    expect(safeHttpsUrl('example.com')).toBe('');
    expect(safeHttpsUrl('')).toBe('');
    expect(safeHttpsUrl(undefined)).toBe('');
  });
});

describe('cleanTestimonials', () => {
  it('keeps a complete entry and tidies its spacing', () => {
    expect(cleanTestimonials([{ ...good, name: '  Sample   Person ' }])).toEqual([good]);
  });
  it('drops entries that are incomplete, too short, too long or have no https link', () => {
    const bad = [
      { ...good, quote: 'Too short.' },
      { ...good, quote: 'x'.repeat(401) },
      { ...good, name: '' },
      { ...good, role: '' },
      { ...good, url: '' },
      { ...good, url: 'http://insecure.example.com' },
      { ...good, url: 'javascript:alert(1)' },
      null,
      'a string',
    ];
    expect(cleanTestimonials(bad)).toEqual([]);
  });
  it('shows at most three, in the order given', () => {
    const many = ['One', 'Two', 'Three', 'Four'].map((name) => ({ ...good, name }));
    expect(cleanTestimonials(many).map((t) => t.name)).toEqual(['One', 'Two', 'Three']);
  });
  it('is safe with nothing or the wrong type', () => {
    expect(cleanTestimonials(undefined)).toEqual([]);
    expect(cleanTestimonials([])).toEqual([]);
    expect(cleanTestimonials('nope')).toEqual([]);
  });
});

describe('testimonialsSection', () => {
  it('is left out completely when there are no valid entries (nothing is invented)', () => {
    expect(testimonialsSection([])).toBe('');
    expect(testimonialsSection([{ ...good, url: '' }])).toBe('');
  });
  it('the real data file ships no placeholder quotes: every entry is complete, or the list is empty', () => {
    expect(Array.isArray(testimonials)).toBe(true);
    expect(cleanTestimonials(testimonials)).toHaveLength(Math.min(testimonials.length, 3));
    expect(JSON.stringify(testimonials)).not.toMatch(/lorem|sample person|example\.com/i);
  });
  it('renders each quote with the name as a link, the role, and an accessible structure', () => {
    const html = testimonialsSection([good, { ...good, name: 'Second Person' }]);
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain('id="testimonials"');
    expect(html).toContain('aria-labelledby="testimonials-title"');
    expect(html.match(/<blockquote/g)).toHaveLength(2);
    expect(html.match(/<figcaption/g)).toHaveLength(2);
    expect(html).toContain(`href="${good.url}" target="_blank" rel="noopener noreferrer"`);
    expect(html).toContain('(opens in a new tab)');
    expect(html).toContain('Lecturer, Sample University');
    expect(html).toContain(`cite="${good.url}"`);
  });
  it('escapes quotes and names, so pasted text can never inject markup', () => {
    const html = testimonialsSection([{ ...good, quote: 'A <script>alert(1)</script> and "quotes" in a long enough quote.', name: 'A <b>Name</b>' }]);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>Name</b>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('home page', () => {
  it('has no testimonials section while the list is empty, and still renders every other section', () => {
    const page = render();
    if (cleanTestimonials(testimonials).length === 0) expect(page).not.toContain('id="testimonials"');
    for (const id of ['about', 'skills', 'journey', 'projects', 'education', 'contact']) expect(page).toContain(`id="${id}"`);
  });
});
