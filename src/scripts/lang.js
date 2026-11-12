// English / Urdu switch. The pages are written and prerendered in English (that is what search engines read); this script
// swaps the text for Urdu from the dictionary in shared/i18n-ur.js and turns the page right-to-left (lang="ur" dir="rtl").
//
// How it works:
//  - the choice is remembered in localStorage ("umer-lang"), and ?lang=ur opens a page in Urdu;
//  - every text node and text attribute (aria-label, placeholder, title) whose whole text is in the dictionary is replaced,
//    and the English original is remembered so the switch back is exact;
//  - the code-like parts (terminal, blog posts, the search palette) are left alone;
//  - text added later (the live "Now" section, the availability badge) is translated by a MutationObserver.
import { urdu, LANG_BUTTON, readsAsEnglish } from '../shared/i18n-ur.js';

const KEY = 'umer-lang';
const SKIP = 'script, style, svg, canvas, textarea, code, pre, [data-no-translate], [data-terminal], [data-prose], dialog.palette';
const BLOCKS = 'p, h1, h2, h3, h4, li, dt, dd, blockquote, figcaption, label';
const ATTRS = ['aria-label', 'placeholder', 'title'];
const root = document.documentElement;

const textNodes = new Map(); // text node -> its English original
const attrValues = new Map(); // element -> { attribute: English original }
let observer = null;
let current = 'en';

const readChoice = () => {
  const asked = new URLSearchParams(location.search).get('lang');
  if (asked === 'ur' || asked === 'en') return asked;
  try {
    return localStorage.getItem(KEY) === 'ur' ? 'ur' : 'en';
  } catch {
    return 'en';
  }
};

const saveChoice = (lang) => {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable: the choice only lasts for this visit */
  }
};

const skipped = (element) => Boolean(element?.closest(SKIP));


function translateText(node) {
  if (skipped(node.parentElement)) return;
  const text = node.nodeValue;
  const ur = urdu(text);
  if (!ur) return;
  const [, lead, , trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!textNodes.has(node)) textNodes.set(node, text);
  node.nodeValue = `${lead}${ur}${trail}`;
}

function translateAttributes(element) {
  if (skipped(element)) return;
  for (const attr of ATTRS) {
    const value = element.getAttribute(attr);
    const ur = value && urdu(value);
    if (!ur) continue;
    const saved = attrValues.get(element) || {};
    if (!(attr in saved)) saved[attr] = value;
    attrValues.set(element, saved);
    element.setAttribute(attr, ur);
  }
}

/** Translates a whole subtree (or one text node) and lets short English blocks keep their own direction. */
function translateTree(node) {
  if (node.nodeType === Node.TEXT_NODE) return translateText(node);
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let text = walker.nextNode(); text; text = walker.nextNode()) translateText(text);
  [node, ...node.querySelectorAll('[aria-label], [placeholder], [title]')].forEach(translateAttributes);
  // English paragraphs (project write-ups, blog excerpts) must not be flipped: a block that has English letters and no
  // Urdu at all reads left to right (and is left-aligned); a block with any Urdu, or no letters, keeps the page direction.
  [node, ...node.querySelectorAll(BLOCKS)].forEach((block) => {
    if (!block.matches?.(BLOCKS) || block.hasAttribute('dir') || skipped(block)) return;
    if (readsAsEnglish(block.textContent)) {
      block.setAttribute('dir', 'ltr');
      block.dataset.i18nDir = '';
    }
  });
}

function restoreEnglish() {
  textNodes.forEach((original, node) => {
    node.nodeValue = original;
  });
  textNodes.clear();
  attrValues.forEach((saved, element) => Object.entries(saved).forEach(([attr, value]) => element.setAttribute(attr, value)));
  attrValues.clear();
  document.querySelectorAll('[data-i18n-dir]').forEach((block) => {
    block.removeAttribute('dir');
    delete block.dataset.i18nDir;
  });
}

function watch() {
  observer?.disconnect();
  observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') translateAttributes(record.target);
      else record.addedNodes.forEach(translateTree);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ATTRS });
}

function paintButton(lang) {
  const info = LANG_BUTTON[lang];
  document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
    const label = button.querySelector('[data-lang-text]');
    if (label) label.textContent = info.text;
    button.setAttribute('aria-label', info.label);
    label?.setAttribute('lang', info.lang === 'ur' ? 'ur' : 'en');
    button.dataset.lang = lang;
  });
}

export function setLanguage(lang, { save = true } = {}) {
  const next = lang === 'ur' ? 'ur' : 'en';
  observer?.disconnect();
  if (next === 'ur') {
    root.lang = 'ur';
    root.dir = 'rtl';
    translateTree(document.body);
    watch();
  } else {
    restoreEnglish();
    root.lang = 'en';
    root.dir = 'ltr';
  }
  current = next;
  paintButton(next);
  if (save) saveChoice(next);
  window.dispatchEvent(new CustomEvent('languagechange', { detail: next }));
}

export function initLang() {
  document.querySelectorAll('[data-lang-toggle]').forEach((button) => button.addEventListener('click', () => setLanguage(current === 'ur' ? 'en' : 'ur')));
  const wanted = readChoice();
  paintButton('en');
  if (wanted === 'ur') setLanguage('ur', { save: false });
}
