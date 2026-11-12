import { nav, links, profile } from '../../data/content.js';
import { esc, list, arrow, external } from '../util.js';

// `base` is '' on the home page and 'index.html' on sub-pages, so hash links still reach the home sections.
export const header = (base = '', current = '') => {
  const href = (h) => (h.startsWith('#') ? base + h : h);
  const cur = (h) => (h === current ? ' aria-current="page"' : '');
  return `
<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><span class="progress__bar" data-progress></span></div>
<header class="site-header" data-header>
  <div class="container site-header__inner">
    <a class="logo" href="${base}#home" aria-label="${esc(profile.shortName)} — back to top">M<span class="logo__dot">.</span>Umer</a>
    <nav class="site-nav" aria-label="Main">
      <ul class="site-nav__list">${list(nav, (item) => `<li><a class="site-nav__link" href="${href(item.href)}"${cur(item.href)} data-nav-link>${esc(item.label)}</a></li>`)}</ul>
    </nav>
    <div class="site-header__actions">
      <button class="icon-btn palette-open" type="button" data-palette-open aria-label="Search the site" aria-keyshortcuts="Control+K Meta+K">
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m13.2 13.2 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <kbd class="palette-open__hint" data-palette-hint aria-hidden="true">Ctrl K</kbd>
      </button>
      <button class="icon-btn lang-toggle" type="button" data-lang-toggle aria-label="Switch to Urdu (اردو)"><span data-lang-text lang="ur">اردو</span></button>
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme">
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor"/></svg>
      </button>
      <a class="btn btn--ink btn--sm site-header__cta" href="${base}#contact">Let’s talk ${arrow('ne')}</a>
      <button class="icon-btn menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
        <span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span></span>
      </button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" data-menu hidden>
  <nav aria-label="Mobile">
    <ol class="mobile-menu__list">${list(nav, (item, i) => `<li style="--i:${i}"><a href="${href(item.href)}"><span class="label">0${i + 1}</span>${esc(item.label)}</a></li>`)}</ol>
  </nav>
  <div class="mobile-menu__foot">
    <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
    <div class="mobile-menu__social">${list(links, (l) => external(l.href, `${esc(l.label)} ${arrow('ne')}`))}</div>
  </div>
</div>`;
};
