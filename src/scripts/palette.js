// Ctrl/Cmd+K command palette: jump to a section, a project or a blog post from anywhere on the site.
//
// How it works, step by step:
//  1. Pressing Ctrl+K (or Cmd+K on a Mac), or clicking the search button in the header, opens a native <dialog>.
//     A native dialog already traps the keyboard focus, closes with Esc and hides the page from screen readers.
//  2. The list starts with the sections and the projects that ship with the site. A small file written by the build,
//     /search-index.json, adds every blog post and any project added later. If it cannot be loaded the palette still works.
//  3. Typing narrows the list (see shared/palette.js). Arrow keys move, Enter opens, Esc closes.
//  4. It follows the ARIA "combobox with listbox" pattern, so screen readers announce the results as you type.
import { sectionItems, builtInProjectItems, itemsFromIndex, rankItems } from '../shared/palette.js';
import { esc, list } from '../render/util.js';

const INDEX_URL = '/search-index.json';

const searchIcon =
  '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m13.2 13.2 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

export function initPalette() {
  const triggers = [...document.querySelectorAll('[data-palette-open]')];
  // Very old browsers have no <dialog>: remove the button instead of leaving one that does nothing.
  if (typeof HTMLDialogElement === 'undefined' || typeof HTMLDialogElement.prototype.showModal !== 'function') {
    triggers.forEach((button) => button.remove());
    return;
  }

  const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);
  document.querySelectorAll('[data-palette-hint]').forEach((el) => {
    el.textContent = isMac ? '⌘ K' : 'Ctrl K';
  });

  let dialog = null;
  let input;
  let listbox;
  let status;
  let items = null; // all searchable things, built the first time the palette opens
  let shown = []; // what the list currently contains
  let active = 0;

  /** Sections that exist on this page (the owner can hide "Now"), projects that ship with the site. */
  const baseItems = () => {
    const onHome = location.pathname === '/' || location.pathname === '/index.html';
    const sections = sectionItems().filter((item) => !item.id || !onHome || document.getElementById(item.id));
    return [...sections, ...builtInProjectItems()];
  };

  const render = () => {
    const query = input.value;
    shown = rankItems(items, query);
    active = Math.min(active, Math.max(shown.length - 1, 0));
    listbox.innerHTML = list(
      shown,
      (item, i) => `<li class="palette__option" role="option" id="palette-option-${i}" data-index="${i}" aria-selected="${i === active}">
        <span class="palette__main"><span class="palette__title">${esc(item.title)}</span>${item.hint ? `<span class="palette__hint">${esc(item.hint)}</span>` : ''}</span>
        <span class="palette__tag">${item.group}</span>
      </li>`,
    );
    input.setAttribute('aria-activedescendant', shown.length ? `palette-option-${active}` : '');
    status.textContent = shown.length ? `${shown.length} result${shown.length === 1 ? '' : 's'}` : `No results for “${query.trim()}”.`;
    dialog.classList.toggle('is-empty', shown.length === 0);
  };

  const setActive = (index) => {
    if (!shown.length) return;
    active = (index + shown.length) % shown.length;
    listbox.querySelectorAll('[role="option"]').forEach((el, i) => el.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', `palette-option-${active}`);
    listbox.querySelector(`#palette-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  };

  const go = (item) => {
    if (!item) return;
    dialog.close();
    location.assign(item.url);
  };

  const build = () => {
    dialog = document.createElement('dialog');
    dialog.className = 'palette';
    dialog.setAttribute('aria-label', 'Search the site');
    dialog.innerHTML = `
      <div class="palette__box">
        <div class="palette__field">
          ${searchIcon}
          <input class="palette__input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
            aria-label="Search sections, projects and posts" placeholder="Search sections, projects, posts…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
          <kbd class="palette__esc" aria-hidden="true">Esc</kbd>
        </div>
        <ul class="palette__list" id="palette-list" role="listbox" aria-label="Results"></ul>
        <p class="palette__status" role="status" aria-live="polite"></p>
        <p class="palette__foot" aria-hidden="true"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span> <span><kbd>Enter</kbd> open</span> <span><kbd>Esc</kbd> close</span></p>
      </div>`;
    document.body.append(dialog);
    input = dialog.querySelector('.palette__input');
    listbox = dialog.querySelector('.palette__list');
    status = dialog.querySelector('.palette__status');

    input.addEventListener('input', () => {
      active = 0;
      render();
    });
    input.addEventListener('keydown', (event) => {
      const keys = {
        ArrowDown: () => setActive(active + 1),
        ArrowUp: () => setActive(active - 1),
        Home: () => setActive(0),
        End: () => setActive(shown.length - 1),
        Enter: () => go(shown[active]),
      };
      if (!keys[event.key] || event.isComposing) return;
      event.preventDefault(); // keep the text cursor where it is
      keys[event.key]();
    });
    listbox.addEventListener('click', (event) => {
      const row = event.target.closest('[data-index]');
      if (row) go(shown[Number(row.dataset.index)]);
    });
    listbox.addEventListener('mousemove', (event) => {
      const row = event.target.closest('[data-index]');
      if (row && Number(row.dataset.index) !== active) setActive(Number(row.dataset.index));
    });
    // A click on the dimmed area outside the box closes it.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      input.value = '';
      active = 0;
    });
  };

  /** Loads the build's index once. Failure is fine: the sections and built-in projects are already there. */
  const loadIndex = async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(INDEX_URL, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) return;
      const extra = itemsFromIndex(await response.json());
      if (!extra.length) return;
      const projectUrls = new Set(extra.filter((x) => x.group === 'Project').map((x) => x.url));
      items = [...items.filter((x) => x.group === 'Section' || !projectUrls.has(x.url)), ...extra];
      if (dialog?.open) render();
    } catch {
      /* offline or no index (for example in development): keep what we have */
    }
  };

  const open = () => {
    if (!dialog) build();
    if (dialog.open) return;
    if (!items) {
      items = baseItems();
      loadIndex();
    }
    active = 0;
    input.value = ''; // always start with a fresh search (does not rely on the close event, which can arrive late)
    dialog.showModal();
    render();
    input.focus();
  };

  const toggle = () => (dialog?.open ? dialog.close() : open());

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault(); // some browsers use Ctrl+K to focus their own search box
      toggle();
    }
  });
  triggers.forEach((button) => button.addEventListener('click', open));
}
