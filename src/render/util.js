// Escape text for safe use inside HTML.
export const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// Join an array of HTML strings produced by map().
export const list = (items, fn) => items.map(fn).join('');

export const arrow = (dir = 'ne') => {
  const paths = {
    ne: 'M5 15 15 5M7 5h8v8',
    down: 'M10 4v12M4.5 10.5 10 16l5.5-5.5',
    right: 'M4 10h12M10.5 4.5 16 10l-5.5 5.5',
    up: 'M10 16V4M4.5 9.5 10 4l5.5 5.5',
  };
  return `<svg class="icon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="${paths[dir]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>`;
};

// A section heading whose lines are revealed one by one. `lines` sets the intended line breaks.
export const heading = ({ index, label, lines, id, tag = 'h2' }) => `
  <header class="section-head">
    <p class="label section-head__label"><span class="section-head__index">(${esc(index)})</span> ${esc(label)}</p>
    <${tag} class="section-head__title" id="${id}" data-lines>${list(lines, (line) => `<span class="line"><span class="line__inner">${line}</span></span>`)}</${tag}>
  </header>`;

export const external = (href, text, cls = '') =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${text}<span class="sr-only"> (opens in a new tab)</span></a>`;
