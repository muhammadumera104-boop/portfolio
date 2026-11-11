// Catches mistyped email domains such as "gma5l.com" or "gmial.com" before a reply is lost. A mail server accepts a message for
// a domain it has never heard of and only bounces it later, so the dashboard cannot tell. Comparing the domain with the big
// providers is a cheap way to ask "did you mean gmail.com?" while the visitor is still on the page.

const COMMON = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'yahoo.co.uk',
  'hotmail.co.uk', 'protonmail.com', 'proton.me', 'msn.com', 'aol.com', 'ymail.com', 'googlemail.com',
];

/** Number of single-character edits (insert, delete, change, or swapping two neighbours) between two strings. */
export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/**
 * @param {string} email
 * @returns {string|null} the address the person probably meant, or null when the domain looks fine
 */
export function suggestEmail(email) {
  const text = String(email ?? '').trim().toLowerCase();
  const at = text.lastIndexOf('@');
  if (at < 1) return null;
  const domain = text.slice(at + 1);
  if (!domain || COMMON.includes(domain)) return null;
  let best = null;
  for (const candidate of COMMON) {
    const distance = editDistance(domain, candidate);
    // 1 edit for short domains, 2 for longer ones; never suggest a swap for domains that are clearly someone else's.
    const limit = candidate.length >= 10 ? 2 : 1;
    if (distance <= limit && (!best || distance < best.distance)) best = { candidate, distance };
  }
  return best ? `${text.slice(0, at)}@${best.candidate}` : null;
}
