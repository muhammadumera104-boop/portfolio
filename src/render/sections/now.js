import { now as builtInNow } from '../../data/content.js';
import { resolveNow, hasNowContent, nowMonthLabel } from '../../shared/now.js';
import { esc, list, heading } from '../util.js';

const column = (title, items) =>
  items.length
    ? `<div class="now__col"><h3 class="now__h3">${title}</h3><ul class="now__list">${list(items, (line) => `<li>${esc(line)}</li>`)}</ul></div>`
    : '';

/**
 * The Now section for already-cleaned content (see shared/now.js). Returns '' when there is nothing to show, so an empty
 * heading never appears. `reveal` is false when it is swapped in after the page loaded.
 */
export const nowHtml = (now, reveal = true) => {
  if (!hasNowContent(now)) return '';
  const label = nowMonthLabel(now.month);
  return `
<section class="section now" id="now" aria-labelledby="now-title">
  <div class="container">
    ${heading({ index: 'Now', label: 'This month', id: 'now-title', lines: ['What I am', '<em>doing</em> right now.'] })}
    <div class="now__grid"${reveal ? ' data-reveal' : ''}>
      ${column('Building', now.building)}
      ${column('Learning', now.learning)}
    </div>
    ${now.note ? `<p class="now__note">${esc(now.note)}</p>` : ''}
    ${label ? `<p class="now__updated label">Updated <time datetime="${esc(now.month)}">${esc(label)}</time></p>` : ''}
  </div>
</section>`;
};

/**
 * The slot on the home page. The build script (build/seo-plugin.js) and scripts/hydrate.js both fill it with the newest
 * content from Firestore; until then it holds the built-in content, so the page is complete without JavaScript.
 */
export const nowSlot = (saved = null, reveal = true) => `<div data-now>${nowHtml(resolveNow(saved, builtInNow), reveal)}</div>`;
