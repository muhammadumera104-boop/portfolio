import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ur, urdu, isolateLatin, LANG_BUTTON, readsAsEnglish } from '../src/shared/i18n-ur.js';
import { header } from '../src/render/sections/header.js';
import { footer } from '../src/render/sections/closing.js';
import { render } from '../src/render/index.js';
import { esc } from '../src/render/util.js';

const read = (path) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
const ARABIC = /[؀-ۿ]/;
const strip = (text) => text.replace(/[⁦⁩]/g, '');

/** Splits "a, b :is(c, d)" into ["a", " b :is(c, d)"]: commas inside parentheses do not separate selectors. */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

describe('the dictionary', () => {
  const entries = Object.entries(ur);

  it('is big enough to cover the page chrome and the main sections', () => {
    expect(entries.length).toBeGreaterThan(150);
  });
  it('every English key has an Urdu text that really contains Urdu letters', () => {
    for (const [english, urdu_] of entries) {
      expect(typeof urdu_, english).toBe('string');
      expect(urdu_.trim().length, english).toBeGreaterThan(0);
      expect(ARABIC.test(urdu_), `no Urdu letters in the text for: ${english}`).toBe(true);
    }
  });
  it('keys are written the way the page writes them (no stray spaces), so they can match', () => {
    for (const [english] of entries) expect(english, english).toBe(english.replace(/\s+/g, ' ').trim());
  });
  it('avoids first-person verb endings that depend on the speaker’s gender (…رہا ہوں / …رہی ہوں / …ہوں)', () => {
    for (const [english, urdu_] of entries) {
      expect(/ رہا ہوں| رہی ہوں| کرتا ہوں| کرتی ہوں| ہوں[۔ ]/.test(urdu_), `gendered verb in: ${english}`).toBe(false);
    }
  });
  it('no dead entries: every English key (except the few that only appear after a click or a language change) is on the page', () => {
    const page = `${render()}${header('', '')}${footer('')}`;
    const dynamic = new Set(['Switch to light theme', 'Close menu', 'Not taking internships right now', 'Introduction', 'Learning']);
    const missing = entries.map(([english]) => english).filter((english) => !dynamic.has(english) && !page.includes(esc(english)) && !page.includes(english));
    expect(missing, `keys that are not on the page: ${missing.join(' | ')}`).toEqual([]);
  });
});

describe('urdu() and isolateLatin()', () => {
  it('finds a translation whatever the spacing around the English text', () => {
    expect(urdu('  About \n ')).toBe(ur.About);
    expect(strip(urdu('Get   in touch'))).toBe(ur['Get in touch']);
  });
  it('returns null for text it does not know, including inherited object names', () => {
    expect(urdu('Something new nobody translated')).toBeNull();
    expect(urdu('constructor')).toBeNull();
    expect(urdu('')).toBeNull();
    expect(urdu(undefined)).toBeNull();
  });
  it('wraps Latin words (C++, Python, GU TECH) in isolates so the symbols keep their order in right-to-left text', () => {
    expect(isolateLatin('سے C++ تک')).toBe('سے ⁦C++⁩ تک');
    expect(isolateLatin('GU TECH، کراچی')).toBe('⁦GU TECH⁩، کراچی');
    expect(isolateLatin('صرف اردو')).toBe('صرف اردو');
    expect(urdu('Computer science student building strong foundations — from C and C++ to Python, and now the web.')).toContain('⁦C++⁩');
  });
});

describe('what stays English', () => {
  it('a block with English letters and no Urdu reads left to right; Urdu, mixed or letterless blocks keep the page direction', () => {
    expect(readsAsEnglish('A console academic management system in C++17')).toBe(true);
    expect(readsAsEnglish('سافٹ ویئر')).toBe(false);
    expect(readsAsEnglish('C C++ PY JS محمد عمر رضوان')).toBe(false); // the hero title mixes both: it must stay right-to-left
    expect(readsAsEnglish('2026 — 2030')).toBe(false);
    expect(readsAsEnglish('')).toBe(false);
  });
  it('the script leaves the terminal, blog posts, code and the search palette alone', () => {
    const code = read('src/scripts/lang.js');
    for (const selector of ['[data-terminal]', '[data-prose]', 'code', 'pre', 'dialog.palette', 'script', 'style', 'svg']) expect(code, selector).toContain(selector);
  });
});

describe('the language button and wiring', () => {
  it('is in the header of every page, with an accessible name that names both languages', () => {
    for (const html of [header(), header('/', ''), render()]) {
      expect(html).toContain('data-lang-toggle');
      expect(html).toContain('aria-label="Switch to Urdu (اردو)"');
      expect(html).toContain('<span data-lang-text lang="ur">اردو</span>');
    }
  });
  it('switching back and forth is described for both directions', () => {
    expect(LANG_BUTTON.en.text).toBe('اردو');
    expect(LANG_BUTTON.ur.text).toBe('EN');
    expect(LANG_BUTTON.ur.label).toContain('Switch to English');
    expect(LANG_BUTTON.en.label).toContain('Switch to Urdu');
  });
  it('starts on the home page and on the sub-pages, and the stylesheet is loaded on both', () => {
    expect(read('src/main.js')).toContain('initLang');
    expect(read('src/main.js')).toContain("import './styles/rtl.css'");
    expect(read('src/blog/shell.js')).toContain('initLang');
    expect(read('src/blog/shell.js')).toContain("import '../styles/rtl.css'");
  });
  it('remembers the choice and honours ?lang=ur, with storage failures handled', () => {
    const code = read('src/scripts/lang.js');
    expect(code).toContain("const KEY = 'umer-lang'");
    expect(code).toContain("new URLSearchParams(location.search).get('lang')");
    expect(code).toMatch(/try \{[\s\S]*localStorage\.setItem[\s\S]*catch/);
  });
  it('the English page is untouched: the build output and the server-rendered HTML stay English with lang="en"', () => {
    expect(read('index.html')).toContain('<html lang="en"');
    const html = render().replace('<span data-lang-text lang="ur">اردو</span>', '').replace(/aria-label="Switch to Urdu[^"]*"/g, '');
    expect(ARABIC.test(html), 'Urdu letters in the server-rendered page other than the language button').toBe(false);
  });
});

describe('right-to-left stylesheet', () => {
  const css = read('src/styles/rtl.css');

  it('only applies when the page is switched to Urdu', () => {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = withoutComments
      .split('}')
      .map((block) => block.split('{')[0])
      .flatMap(splitTopLevel)
      .map((selector) => selector.trim())
      .filter((selector) => selector && !selector.startsWith('@') && !/^\d/.test(selector) && selector !== 'from' && selector !== 'to');
    const unscoped = rules.filter((selector) => !/html\[(lang|dir)=/.test(selector) && selector !== '.lang-toggle');
    expect(unscoped, `rules outside html[lang=ur] / html[dir=rtl]: ${unscoped.join(' | ')}`).toEqual([]);
  });
  it('removes letter spacing and forced capitals, which would break joined Arabic-script letters', () => {
    expect(css).toMatch(/letter-spacing: 0 !important/);
    expect(css).toMatch(/text-transform: none !important/);
  });
  it('mirrors arrows and keeps the terminal and wordmark left to right', () => {
    expect(css).toMatch(/\.icon \{\s*transform: scaleX\(-1\)/);
    expect(css).toContain('[data-terminal]');
    expect(css).toContain('.site-footer__wordmark');
  });
});
