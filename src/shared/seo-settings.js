// The home page's search-result title and description, editable from the admin dashboard ("SEO" tab).
//
// Where it comes from, in this order:
//   1. the document `experiences/seo` in Firestore (saved from the dashboard);
//   2. the built-in title and description in build/seo-plugin.js.
// Like "Now" and the availability badge it lives in the `experiences` collection, whose security rules already let
// anyone read and only the owner write, so no rules had to change.

export const SEO_DOC_ID = 'seo';

// Google shows roughly 60 characters of a title and 155 of a description before cutting them off.
export const TITLE_MAX = 70;
export const DESCRIPTION_MAX = 160;

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/** A tidy { title, description } from anything the database might hold. Too-long or missing values become ''. */
export function cleanSeo(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const title = clean(source.title);
  const description = clean(source.description);
  return {
    title: title.length <= TITLE_MAX ? title : '',
    description: description.length <= DESCRIPTION_MAX ? description : '',
  };
}

/** Use the owner's value when there is one, otherwise the built-in one. Each field is decided on its own. */
export function resolveSeo(saved, fallback) {
  const mine = cleanSeo(saved);
  return { title: mine.title || fallback.title, description: mine.description || fallback.description };
}

/** The built-in home page title and description (used until the owner saves their own in the dashboard). */
export const HOME_SEO = {
  title: 'Muhammad Umer Rizwan (Umer Lakhani) — Developer in Karachi',
  description: 'Muhammad Umer Rizwan, also known as Umer Lakhani: BSCS student at GU TECH, Karachi. Projects in C, C++, Python and the web, and a programming blog.',
};
