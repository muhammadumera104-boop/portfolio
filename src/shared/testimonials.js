// Testimonials come from the `testimonials` list in src/data/content.js. This file decides which entries are good
// enough to show, so one typo in the data can never break the page.
//
// Each entry needs: quote, name, role, url (a link where a visitor can check who the person is).

const MAX_SHOWN = 3;

/** An https address, or '' when the person has no public page. Anything else (http:, javascript:, junk) is dropped. */
export function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/**
 * Keeps only complete entries and at most three of them.
 * quote: 20 to 400 characters, name: 2 to 80, role: 2 to 100, url: https only.
 */
export function cleanTestimonials(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({ quote: clean(item?.quote), name: clean(item?.name), role: clean(item?.role), url: safeHttpsUrl(item?.url) }))
    .filter((t) => t.quote.length >= 20 && t.quote.length <= 400 && t.name.length >= 2 && t.name.length <= 80 && t.role.length >= 2 && t.role.length <= 100 && t.url !== '')
    .slice(0, MAX_SHOWN);
}
