import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanAvailability, resolveAvailability, availabilityLabel, OPEN_LABEL, CLOSED_LABEL, AVAILABILITY_DOC_ID } from '../src/shared/availability.js';
import { availabilityHtml, availabilityBadge } from '../src/render/sections/availability.js';
import { availabilitySchema, experienceSchema } from '../src/shared/schemas.js';
import { hero } from '../src/render/sections/hero.js';
import { render } from '../src/render/index.js';
import { availability as builtIn } from '../src/data/content.js';
import { swap } from '../build/seo.js';
import { decodeDocument } from '../build/firestore-rest.js';

const read = (path) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');

describe('cleanAvailability', () => {
  it('is open unless it says otherwise, so a missing or broken document never hides the badge by accident', () => {
    for (const odd of [null, undefined, {}, 'text', 5, []]) expect(cleanAvailability(odd).open).toBe(true);
    expect(cleanAvailability({ open: false }).open).toBe(false);
    expect(cleanAvailability({ open: 'false' }).open).toBe(false);
    expect(cleanAvailability({ open: true }).open).toBe(true);
  });
  it('keeps the owner’s own words only when they are short enough', () => {
    expect(cleanAvailability({ text: '  Open from   June  ' }).text).toBe('Open from June');
    expect(cleanAvailability({ text: 'x'.repeat(41) }).text).toBe('');
    expect(cleanAvailability({}).text).toBe('');
  });
});

describe('resolveAvailability and the label', () => {
  it('a saved document wins; otherwise the built-in setting is used', () => {
    expect(resolveAvailability({ open: false }, builtIn).open).toBe(false);
    expect(resolveAvailability(null, { open: false, text: '' }).open).toBe(false);
    expect(resolveAvailability(undefined, builtIn)).toEqual(cleanAvailability(builtIn));
  });
  it('uses the standard words for open and closed, or the owner’s own words', () => {
    expect(availabilityLabel({ open: true, text: '' })).toBe(OPEN_LABEL);
    expect(availabilityLabel({ open: false, text: '' })).toBe(CLOSED_LABEL);
    expect(availabilityLabel({ open: true, text: 'Open from June' })).toBe('Open from June');
    expect(OPEN_LABEL).toBe('Open to internships'); // the words the site has always used
  });
  it('the built-in setting keeps today’s behaviour: open, standard words', () => {
    expect(builtIn).toEqual({ open: true, text: '' });
  });
});

describe('the badge', () => {
  it('shows the open state with the standard words and no closed styling', () => {
    const html = availabilityHtml({ open: true, text: '' });
    expect(html).toContain('Open to internships');
    expect(html).toContain('data-availability');
    expect(html).toContain('class="label hero__status"');
    expect(html).not.toContain('is-closed');
  });
  it('shows the closed state with different words and a class that greys the dot', () => {
    const html = availabilityHtml({ open: false, text: '' });
    expect(html).toContain('Not taking internships right now');
    expect(html).toContain('hero__status is-closed');
    expect(html).not.toContain('Open to internships');
  });
  it('escapes the owner’s own words', () => {
    const html = availabilityHtml({ open: true, text: '<b>hi</b>' });
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;');
  });
  it('the dot is decorative, hidden from screen readers, while the words are real text', () => {
    expect(availabilityHtml({ open: true, text: '' })).toContain('<span class="status-dot" aria-hidden="true"></span>Open to internships');
  });
});

describe('on the home page', () => {
  it('the hero contains the badge between the markers the build swaps, in its usual place', () => {
    const html = hero();
    expect(html).toContain('<!--availability:start-->');
    expect(html).toContain('<!--availability:end-->');
    expect(html).toContain('Open to internships');
    expect(html.indexOf('hero__meta')).toBeLessThan(html.indexOf('data-availability'));
  });
  it('the build can swap in a closed badge without touching the rest of the page, and swapping twice changes nothing more', () => {
    const page = render();
    const closed = swap(page, 'availability', availabilityBadge({ open: false, text: '' }));
    expect(closed).toContain('Not taking internships right now');
    expect(closed).not.toContain('>Open to internships<');
    expect(closed).toContain('id="contact"');
    expect(swap(closed, 'availability', availabilityBadge({ open: false, text: '' }))).toBe(closed);
  });
  it('a document read from the Firestore REST API (a real boolean) is understood', () => {
    const doc = decodeDocument({
      name: `projects/p/databases/(default)/documents/experiences/${AVAILABILITY_DOC_ID}`,
      fields: { kind: { stringValue: 'availability' }, open: { booleanValue: false }, text: { stringValue: '' } },
    });
    expect(doc.id).toBe('availability');
    expect(availabilityHtml(resolveAvailability(doc, builtIn))).toContain('Not taking internships right now');
  });
});

describe('the admin form and its schema', () => {
  it('accepts open or closed with or without words, and rejects words over 40 characters', () => {
    expect(availabilitySchema.safeParse({ open: true, text: '' }).success).toBe(true);
    expect(availabilitySchema.safeParse({ open: false, text: 'Back in January' }).success).toBe(true);
    expect(availabilitySchema.safeParse({ open: true, text: 'x'.repeat(41) }).success).toBe(false);
  });
  it('the Education form cannot hold this document, and the Education list hides it', () => {
    expect(experienceSchema.safeParse({ kind: 'availability', title: 'Open', place: 'Here' }).success).toBe(false);
    expect(read('src/admin/admin.js')).toContain("filter((d) => !['now', 'availability'].includes(d.kind))");
  });
  it('the dashboard has an Availability tab that saves experiences/availability', () => {
    const code = read('src/admin/admin.js');
    expect(code).toContain("['availability', 'Availability']");
    expect(code).toContain("api.saveDoc('experiences', AVAILABILITY_DOC_ID, { kind: 'availability'");
  });
  it('the browser refreshes the badge from the database, and the security rules need no change', () => {
    expect(read('src/scripts/hydrate.js')).toContain('availabilityHtml(resolveAvailability(availability, builtInAvailability))');
    expect(read('firestore.rules')).toMatch(/match \/experiences\/\{id\} \{\s*allow read: if true;\s*allow write: if isAdmin\(\);/);
  });
});
