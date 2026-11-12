// The "Open to internships" badge in the hero, which the owner can switch on and off in the admin dashboard.
//
// Where it comes from, in this order:
//   1. the document `experiences/availability` in Firestore (saved from the dashboard's Availability tab);
//   2. the built-in `availability` object in src/data/content.js, used before the first save or when Firestore is unreachable.
// Like the "Now" section it lives in the existing `experiences` collection, whose security rules already let anyone read
// and only the owner write, so no rules had to be changed.

export const AVAILABILITY_DOC_ID = 'availability';

export const OPEN_LABEL = 'Open to internships';
export const CLOSED_LABEL = 'Not taking internships right now';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/** A tidy { open, text } from anything the database might hold. `text` replaces the default words (40 characters at most). */
export function cleanAvailability(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const text = clean(source.text);
  return { open: source.open !== false && source.open !== 'false', text: text.length <= 40 ? text : '' };
}

/** A saved document wins; without one, the built-in setting is used. */
export const resolveAvailability = (saved, fallback) => cleanAvailability(saved && typeof saved === 'object' ? saved : fallback);

/** The words on the badge: the owner's own text if there is one, otherwise the standard words for open or closed. */
export const availabilityLabel = ({ open, text }) => text || (open ? OPEN_LABEL : CLOSED_LABEL);
