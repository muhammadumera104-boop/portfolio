// Certificates and achievements come from the `certificates` and `achievements` lists in src/data/content.js.
// These helpers decide which entries are complete enough to show, so a typo in the data can never break the page.
import { safeHttpsUrl } from './testimonials.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const between = (text, min, max) => text.length >= min && text.length <= max;

/** Accepts '2025-03' (month) or '2025' (year, for when the month is not known). Returns '' for anything else. */
export function validDate(value) {
  const match = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/.exec(clean(value));
  if (!match) return '';
  const year = Number(match[1]);
  return year >= 2000 && year <= 2100 ? match[0] : '';
}

/** '2025-03' becomes 'Mar 2025'; '2025' stays '2025'. */
export function formatDate(value) {
  const date = validDate(value);
  if (!date) return '';
  const [year, month] = date.split('-');
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

const newestFirst = (a, b) => b.date.localeCompare(a.date);

/** A certificate needs a title, an issuer and a date. The verification link is optional but must be https. */
export function cleanCertificates(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((c) => ({ title: clean(c?.title), issuer: clean(c?.issuer), date: validDate(c?.date), url: safeHttpsUrl(c?.url) }))
    .filter((c) => between(c.title, 3, 120) && between(c.issuer, 2, 100) && c.date !== '')
    .sort(newestFirst)
    .slice(0, 12);
}

/** An achievement needs a title, a short detail and a date. The link is optional but must be https. */
export function cleanAchievements(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((a) => ({ title: clean(a?.title), detail: clean(a?.detail), date: validDate(a?.date), url: safeHttpsUrl(a?.url) }))
    .filter((a) => between(a.title, 3, 120) && between(a.detail, 10, 300) && a.date !== '')
    .sort(newestFirst)
    .slice(0, 12);
}
