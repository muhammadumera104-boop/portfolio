// Page frame shared by blog.html and post.html: the same header and footer as the home page.
import '@fontsource-variable/dm-sans/opsz.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/app.css';
import { header } from '../render/sections/header.js';
import { footer } from '../render/sections/closing.js';
import { initTheme } from '../scripts/theme.js';
import { initNav } from '../scripts/nav.js';

/** Builds the page and returns the <main> element to render into. */
export function mountShell({ current = '' } = {}) {
  document.body.insertAdjacentHTML(
    'afterbegin',
    `${header('index.html', current)}<main id="main" class="page"></main>${footer('index.html')}`,
  );
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

/** Updates <title> and the description / Open Graph tags for the current page. */
export function setMeta({ title, description, image }) {
  document.title = title;
  const set = (selector, attr, value, create) => {
    if (!value) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      create(el);
      document.head.append(el);
    }
    el.setAttribute(attr, value);
  };
  set('meta[name="description"]', 'content', description, (el) => el.setAttribute('name', 'description'));
  set('meta[property="og:title"]', 'content', title, (el) => el.setAttribute('property', 'og:title'));
  set('meta[property="og:description"]', 'content', description, (el) => el.setAttribute('property', 'og:description'));
  set('meta[property="og:image"]', 'content', image, (el) => el.setAttribute('property', 'og:image'));
}
