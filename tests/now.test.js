import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanNow, resolveNow, hasNowContent, validMonth, NOW_DOC_ID, MAX_LINES } from '../src/shared/now.js';
import { nowHtml, nowSlot } from '../src/render/sections/now.js';
import { nowSchema, experienceSchema } from '../src/shared/schemas.js';
import { render } from '../src/render/index.js';
import { now as builtInNow } from '../src/data/content.js';
import { swap } from '../build/seo.js';
import { decodeDocument } from '../build/firestore-rest.js';

const saved = { kind: 'now', month: '2026-12', building: ['A saved building line'], learning: ['A saved learning line'], note: 'A short note.' };

describe('cleanNow', () => {
  it('tidies spacing, keeps the month, and limits each list to five short lines', () => {
    const now = cleanNow({ month: '2026-12', building: ['  one   two ', '', 'x'.repeat(121), 'ok'], learning: Array.from({ length: 9 }, (_, i) => `line ${i}`), note: ' hi ' });
    expect(now.building).toEqual(['one two', 'ok']);
    expect(now.learning).toHaveLength(MAX_LINES);
    expect(now.month).toBe('2026-12');
    expect(now.note).toBe('hi');
  });
  it('drops a month that is not YYYY-MM, a note over 200 characters, and survives odd input', () => {
    expect(validMonth('2026-13')).toBe('');
    expect(validMonth('2026')).toBe('');
    expect(validMonth('November')).toBe('');
    expect(cleanNow({ month: 'soon' }).month).toBe('');
    expect(cleanNow({ note: 'n'.repeat(201) }).note).toBe('');
    for (const bad of [null, undefined, 'text', 5, []]) expect(cleanNow(bad)).toEqual({ month: '', building: [], learning: [], note: '' });
    expect(cleanNow({ building: 'not a list' }).building).toEqual([]);
  });
});

describe('resolveNow', () => {
  it('uses the saved document when there is one, and the built-in content otherwise', () => {
    expect(resolveNow(saved, builtInNow).building).toEqual(['A saved building line']);
    expect(resolveNow(null, builtInNow)).toEqual(cleanNow(builtInNow));
    expect(resolveNow(undefined, builtInNow).building.length).toBeGreaterThan(0);
  });
  it('a saved document with both lists emptied hides the section on purpose', () => {
    const emptied = resolveNow({ kind: 'now', month: '2026-12', building: [], learning: [] }, builtInNow);
    expect(hasNowContent(emptied)).toBe(false);
    expect(nowHtml(emptied)).toBe('');
  });
});

describe('the built-in content', () => {
  it('passes the same schema the admin form uses, so the form can show and save it', () => {
    const result = nowSchema.safeParse(builtInNow);
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
    expect(hasNowContent(cleanNow(builtInNow))).toBe(true);
  });
});

describe('nowSchema', () => {
  it('accepts a normal entry and an empty one (empty hides the section)', () => {
    expect(nowSchema.safeParse({ month: '2026-11', building: ['a'], learning: ['b'], note: '' }).success).toBe(true);
    expect(nowSchema.safeParse({ month: '', building: [], learning: [], note: '' }).success).toBe(true);
  });
  it('rejects more than five lines, an empty line, a long line, a wrong month and a long note', () => {
    expect(nowSchema.safeParse({ building: Array(6).fill('x') }).success).toBe(false);
    expect(nowSchema.safeParse({ building: [''] }).success).toBe(false);
    expect(nowSchema.safeParse({ learning: ['x'.repeat(121)] }).success).toBe(false);
    expect(nowSchema.safeParse({ month: '11/2026' }).success).toBe(false);
    expect(nowSchema.safeParse({ note: 'n'.repeat(201) }).success).toBe(false);
  });
  it('the Education form does not accept a "now" document, so the two can never be mixed up', () => {
    expect(experienceSchema.safeParse({ kind: 'now', title: 'Now', place: 'Here' }).success).toBe(false);
  });
});

describe('nowHtml', () => {
  const now = cleanNow(saved);

  it('renders one heading, both columns, the note and the month, with the section id the page links to', () => {
    const html = nowHtml(now);
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain('id="now"');
    expect(html).toContain('aria-labelledby="now-title"');
    expect(html).toContain('<h3 class="now__h3">Building</h3>');
    expect(html).toContain('<h3 class="now__h3">Learning</h3>');
    expect(html).toContain('A saved building line');
    expect(html).toContain('A short note.');
    expect(html).toContain('<time datetime="2026-12">Dec 2026</time>');
  });
  it('shows only the column that has lines, and leaves out an unknown month', () => {
    const only = nowHtml(cleanNow({ month: 'x', building: ['Only this'] }));
    expect(only).toContain('Building');
    expect(only).not.toContain('Learning');
    expect(only).not.toContain('Updated');
  });
  it('marks the grid for the scroll animation only when it is part of the first render', () => {
    expect(nowHtml(now, true)).toContain('data-reveal');
    expect(nowHtml(now, false)).not.toContain('data-reveal');
  });
  it('escapes everything the owner types, so the dashboard cannot inject markup', () => {
    const html = nowHtml(cleanNow({ building: ['<script>alert(1)</script>'], learning: ['"quoted" & <b>bold</b>'], note: '<img src=x onerror=alert(1)>' }));
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('nowSlot and the home page', () => {
  it('the slot holds the built-in content until a saved version is given', () => {
    expect(nowSlot()).toContain(builtInNow.building[0]);
    expect(nowSlot(saved)).toContain('A saved building line');
    expect(nowSlot(saved)).not.toContain(builtInNow.building[0]);
    expect(nowSlot(saved)).toMatch(/^<div data-now>/);
  });
  it('the home page has the Now section after Education, wrapped in the markers the build swaps', () => {
    const page = render();
    expect(page).toContain('<!--now:start-->');
    expect(page).toContain('<!--now:end-->');
    expect(page.indexOf('id="education"')).toBeLessThan(page.indexOf('id="now"'));
    expect(page).toContain('data-now');
  });
  it('the build can swap in the saved version, and swapping twice gives the same page', () => {
    const page = render();
    const once = swap(page, 'now', nowSlot(saved));
    expect(once).toContain('A saved building line');
    expect(once).not.toContain(builtInNow.building[0]);
    expect(swap(once, 'now', nowSlot(saved))).toBe(once);
    expect(once).toContain('id="contact"'); // the rest of the page is untouched
  });
});

describe('reading the document from Firestore', () => {
  it('a document as the REST API sends it becomes a valid Now', () => {
    const doc = decodeDocument({
      name: `projects/p/databases/(default)/documents/experiences/${NOW_DOC_ID}`,
      fields: {
        kind: { stringValue: 'now' },
        month: { stringValue: '2026-12' },
        building: { arrayValue: { values: [{ stringValue: 'Built from REST' }] } },
        learning: { arrayValue: { values: [{ stringValue: 'Learned from REST' }] } },
        note: { stringValue: '' },
      },
    });
    expect(doc.id).toBe('now');
    expect(cleanNow(doc)).toEqual({ month: '2026-12', building: ['Built from REST'], learning: ['Learned from REST'], note: '' });
  });
  it('a document that has no array fields at all does not break anything', () => {
    expect(hasNowContent(cleanNow({ id: 'now', kind: 'now' }))).toBe(false);
  });
});

describe('code that must not regress', () => {
  const read = (path) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');

  it('the browser no longer overwrites the code-owned case studies from the database', () => {
    expect(read('src/scripts/hydrate.js')).not.toContain('patchBuiltIn');
  });
  it('the admin keeps the Now document out of the Education list', () => {
    expect(read('src/admin/admin.js')).toContain("filter((d) => d.kind !== 'now')");
  });
  it('the security rules already protect the collection the Now document lives in (no rules change needed)', () => {
    const rules = read('firestore.rules');
    expect(rules).toMatch(/match \/experiences\/\{id\} \{\s*allow read: if true;\s*allow write: if isAdmin\(\);/);
  });
});
