// The "Now" section: what I am building and learning this month.
//
// Where the content comes from, in this order:
//   1. the document `experiences/now` in Firestore, which the owner edits in the admin dashboard (Now tab);
//   2. the built-in `now` object in src/data/content.js, used before the first save or when Firestore is unreachable.
// (It lives in the existing `experiences` collection on purpose: its security rules already let anyone read and only the
// owner write, so no rules had to be changed.)
import { validDate, formatDate } from './credentials.js';

export const NOW_DOC_ID = 'now';
export const MAX_LINES = 5;

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const lines = (value) =>
  (Array.isArray(value) ? value : [])
    .map(clean)
    .filter((line) => line.length >= 1 && line.length <= 120)
    .slice(0, MAX_LINES);

/** '2026-11' only (the month the page was last updated). Anything else becomes ''. */
export function validMonth(value) {
  const date = validDate(value);
  return /^\d{4}-\d{2}$/.test(date) ? date : '';
}

/** A tidy { month, building, learning, note } from anything the database might hold. */
export function cleanNow(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const note = clean(source.note);
  return {
    month: validMonth(source.month),
    building: lines(source.building),
    learning: lines(source.learning),
    note: note.length <= 200 ? note : '',
  };
}

/**
 * Picks what to show. A saved document wins, even when the owner emptied both lists (that hides the section on purpose).
 * Without a saved document the built-in content is used.
 */
export function resolveNow(saved, fallback) {
  return saved && typeof saved === 'object' ? cleanNow(saved) : cleanNow(fallback);
}

export const hasNowContent = (now) => now.building.length + now.learning.length > 0;

export const nowMonthLabel = (month) => formatDate(month);
