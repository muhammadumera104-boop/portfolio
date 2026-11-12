// Answers for the newer console commands (blog, resume, hire, theme) and the hidden easter egg.
// Pure functions that return lines, so they are covered by tests; scripts/terminal.js prints them.
// A line is either a string or { text, href } for a link.
import { cv, profile, about, links } from '../data/content.js';
import { isSitePath } from './palette.js';

/** `theme`, `theme dark`, `theme light`, `theme toggle`. Returns the theme to switch to, or null when the word is not understood. */
export function themeChoice(arg, current) {
  const word = String(arg ?? '').toLowerCase();
  if (word === '' || word === 'toggle' || word === 'switch') return current === 'dark' ? 'light' : 'dark';
  if (word === 'dark' || word === 'light') return word;
  return null;
}

export const themeUsage = () => ['Usage: theme [dark|light|toggle]'];

/** The newest blog posts, from the search index that the build writes (see shared/palette.js). */
export function blogLines(index, limit = 5) {
  const posts = (Array.isArray(index?.posts) ? index.posts : []).filter((p) => p && typeof p.title === 'string' && isSitePath(p.url)).slice(0, limit);
  if (posts.length === 0) return [{ text: 'Open the blog →', href: '/blog/' }];
  return [
    `Latest ${posts.length} post${posts.length === 1 ? '' : 's'}:`,
    ...posts.map((p) => ({ text: `${p.title}${p.kind ? `  [${p.kind}]` : ''}`, href: p.url })),
    { text: 'All posts →', href: '/blog/' },
  ];
}

export const resumeLines = () => [
  'One-page CV, made from this site’s content:',
  { text: `Download ${cv.file}`, href: cv.path },
];

/** What a recruiter needs in one place: what I am looking for, how to reach me, and where the proof is. */
export function hireLines() {
  const looking = about.facts.find((f) => f.label === 'Looking for')?.value;
  return [
    `${profile.name} is looking for: ${looking || 'an internship'}.`,
    'Studying BSCS at GU TECH, Karachi. Comfortable in C, C++ and Python, and building for the web.',
    { text: `Email: ${profile.email}`, href: `mailto:${profile.email}` },
    ...links.map((l) => ({ text: `${l.label}: ${l.handle}`, href: l.href })),
    { text: 'Download CV (PDF)', href: cv.path },
    { text: 'Case studies with real code →', href: '/#projects' },
  ];
}

/**
 * The hidden easter egg (it is not listed in "help" and is not tab-completed): anything that starts with "sudo".
 * "sudo hire umer" is the happy ending; every other sudo gets the classic reply.
 */
export function eggLines(args) {
  const words = args.map((w) => String(w).toLowerCase());
  if (words.join(' ') === 'hire umer' || words.join(' ') === 'hire me') {
    return [
      '[sudo] password for recruiter: ********',
      'Access granted. Running hire --umer ...',
      '  [####################] 100%  offer.pdf generated',
      'Just kidding, but the interview is easy to book:',
      { text: profile.email, href: `mailto:${profile.email}` },
    ];
  }
  return ['recruiter is not in the sudoers file. This incident will be reported.', 'Hint: some commands are worth more than others. Try sudo hire umer.'];
}
