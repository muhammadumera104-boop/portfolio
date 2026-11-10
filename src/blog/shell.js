// Page frame shared by the blog list and post pages: the same header and footer as the home page.
// The build prerenders this frame (and the post content) into the HTML so search engines can read it;
// here we only attach behaviour, or build the frame if the page was opened without prerendering.
import '@fontsource-variable/dm-sans/opsz.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/app.css';
import { shellHtml, BLOG_PATH } from '../render/shell.js';
import { initTheme } from '../scripts/theme.js';
import { initNav } from '../scripts/nav.js';

/** Returns the <main> element to render into. */
export function mountShell({ current = BLOG_PATH } = {}) {
  if (!document.getElementById('main')) document.body.insertAdjacentHTML('afterbegin', shellHtml({ current }));
  [initTheme, initNav].forEach((init) => {
    try {
      init();
    } catch (error) {
      console.error(`[${init.name}]`, error);
    }
  });
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
  return document.getElementById('main');
}

const upsert = (selector, make, attr, value) => {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = make();
    document.head.append(el);
  }
  el.setAttribute(attr, value);
};
const metaName = (name) => () => Object.assign(document.createElement('meta'), { name });
const metaProp = (property) => () => {
  const el = document.createElement('meta');
  el.setAttribute('property', property);
  return el;
};

/** Updates <title>, description, canonical, Open Graph and Twitter tags for the current page. */
export function setMeta({ title, description, image, url, type }) {
  document.title = title;
  upsert('meta[name="description"]', metaName('description'), 'content', description);
  upsert('meta[property="og:title"]', metaProp('og:title'), 'content', title);
  upsert('meta[property="og:description"]', metaProp('og:description'), 'content', description);
  upsert('meta[property="og:image"]', metaProp('og:image'), 'content', image);
  upsert('meta[property="og:url"]', metaProp('og:url'), 'content', url);
  upsert('meta[property="og:type"]', metaProp('og:type'), 'content', type);
  upsert('meta[name="twitter:title"]', metaName('twitter:title'), 'content', title);
  upsert('meta[name="twitter:description"]', metaName('twitter:description'), 'content', description);
  upsert('meta[name="twitter:image"]', metaName('twitter:image'), 'content', image);
  upsert('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url);
}

/** Replaces the page's JSON-LD with `data` (one script, marked so it can be swapped). */
export function setJsonLd(json) {
  document.head.querySelector('script[data-ld="page"]')?.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.ld = 'page';
  script.textContent = json;
  document.head.append(script);
}
