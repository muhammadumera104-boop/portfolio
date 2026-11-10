// Images and video guides: Cloudinary thumbnails, and link handling for YouTube, Vimeo, Cloudinary video
// and plain video files. Everything is pure, so the build, the browser and the tests share it.
//
// A post stores its video guides as [{ url, title }]. Plain strings (older data, or one URL per line in
// the admin form) are accepted everywhere and treated as { url, title: '' }.
import { optimizeImage } from './cloudinary.js';

/** Smaller, cropped, auto-format version of a Cloudinary image (600x340 by default). Other URLs pass through. */
export const thumbnail = (url, { width = 600, height = 340 } = {}) => (url ? optimizeImage(url, { width, height }) : '');

// ── YouTube ─────────────────────────────────────────────────
const ID = /^[\w-]{11}$/;

/** The 11-character video id of a youtube.com / youtu.be / embed / shorts link, otherwise null. */
export function youtubeId(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})(?:\/|$)/)?.[1] ?? null;
  }
  return id && ID.test(id) ? id : null;
}

/** 480x360 frame with the video centred in a 16:9 band: crop it with object-fit: cover. */
export const youtubeThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// ── Other providers ─────────────────────────────────────────
const CLOUDINARY_VIDEO = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.+)$/;
const VIMEO = /^https?:\/\/(?:www\.)?vimeo\.com\/(?:video\/)?(\d{6,12})(?:[?#/].*)?$/i;
const FILE = /\.(mp4|webm|mov)(?:\?.*)?$/i;

/**
 * Describes a video link for display, or null if it is not one we accept:
 * { provider: 'youtube'|'vimeo'|'file', href, thumb, label, id?, embed?, src? }
 *  - href  is where the link goes (opens in a new tab)
 *  - thumb is a thumbnail address ('' when the provider has none)
 *  - embed is an iframe address for click-to-play (YouTube, Vimeo); src is a file for a <video> element
 * Only https links are accepted (plain http only for YouTube and Vimeo, which upgrade it).
 */
export function videoInfo(link) {
  const url = String(link ?? '').trim();
  if (!/^https:\/\/\S+$/i.test(url) && !/^http:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(url)) return null;

  const yt = youtubeId(url);
  if (yt) {
    return {
      provider: 'youtube', id: yt, label: 'YouTube',
      href: `https://www.youtube.com/watch?v=${yt}`,
      thumb: youtubeThumb(yt),
      embed: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&autoplay=1`,
    };
  }

  const vimeo = VIMEO.exec(url);
  // Vimeo thumbnails need an API call, so those links show a plain play tile.
  if (vimeo) {
    return {
      provider: 'vimeo', id: vimeo[1], label: 'Vimeo',
      href: `https://vimeo.com/${vimeo[1]}`, thumb: '',
      embed: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`,
    };
  }

  const cloud = CLOUDINARY_VIDEO.exec(url);
  if (cloud) {
    const poster = `${cloud[1]}so_0,c_fill,w_600,h_340,q_auto,f_jpg/${cloud[2].replace(/\.[a-z0-9]+(\?.*)?$/i, '')}.jpg`;
    return { provider: 'file', label: 'Video', href: url, src: url, thumb: poster };
  }
  if (FILE.test(url)) return { provider: 'file', label: 'Video', href: url, src: url, thumb: '' };
  return null;
}

// ── Lists of videos ─────────────────────────────────────────
/**
 * Cleans a list of videos from the database or a form: accepts strings or { url, title }, keeps the
 * valid links, rewrites them to their canonical address, trims titles and drops duplicates.
 * @returns {Array<{url: string, title: string} & NonNullable<ReturnType<typeof videoInfo>>>}
 */
export function normalizeVideos(videos) {
  const seen = new Set();
  const out = [];
  for (const entry of Array.isArray(videos) ? videos : []) {
    const raw = typeof entry === 'string' ? { url: entry } : entry;
    const info = videoInfo(raw?.url);
    if (!info || seen.has(info.href)) continue;
    seen.add(info.href);
    out.push({ ...info, url: info.href, title: String(raw?.title ?? '').trim().slice(0, 120) });
  }
  return out;
}

/**
 * "URL" or "URL | title" per line -> [{ url, title }]. Lines are NOT validated here, so the form's schema can
 * report a bad link instead of silently losing it.
 */
export function parseVideoLines(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, ...rest] = line.split('|');
      return { url: url.trim(), title: rest.join('|').trim() };
    });
}

/** The inverse of parseVideoLines, for filling the form. */
export const formatVideoLines = (videos) =>
  (Array.isArray(videos) ? videos : [])
    .map((v) => (typeof v === 'string' ? v : v?.title ? `${v.url} | ${v.title}` : v?.url))
    .filter(Boolean)
    .join('\n');

// ── External reference links ("Further reading") ────────────
/** "URL" or "URL | title" per line -> [{ url, title }], not validated (the form schema reports bad links). */
export const parseResourceLines = parseVideoLines;
export const formatResourceLines = formatVideoLines;

/** Keeps only https links, trims titles (falling back to the host name) and drops duplicates. */
export function normalizeResources(resources) {
  const seen = new Set();
  const out = [];
  for (const entry of Array.isArray(resources) ? resources : []) {
    const raw = typeof entry === 'string' ? { url: entry } : entry;
    let url;
    try {
      url = new URL(String(raw?.url ?? '').trim());
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' || seen.has(url.href)) continue;
    seen.add(url.href);
    out.push({ url: url.href, title: String(raw?.title ?? '').trim().slice(0, 120) || url.hostname.replace(/^www\./, '') });
  }
  return out;
}

// ── Screenshots and challenge/solution pairs (projects) ─────
/** "image URL | alt text" per line -> [{ url, alt }]. Not validated here. */
export function parseScreenshotLines(text) {
  return parseVideoLines(text).map(({ url, title }) => ({ url, alt: title }));
}
export const formatScreenshotLines = (shots) =>
  (Array.isArray(shots) ? shots : []).map((s) => (typeof s === 'string' ? s : s?.alt ? `${s.url} | ${s.alt}` : s?.url)).filter(Boolean).join('\n');

/** "challenge | solution" per line -> [{ challenge, solution }]. */
export function parseChallengeLines(text) {
  return parseVideoLines(text).map(({ url, title }) => ({ challenge: url, solution: title }));
}
export const formatChallengeLines = (items) =>
  (Array.isArray(items) ? items : []).map((c) => `${c.challenge} | ${c.solution}`).join('\n');
