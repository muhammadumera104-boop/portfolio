import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { hero } from '../src/render/sections/hero.js';
import { profile } from '../src/data/content.js';

describe('hero photo', () => {
  const html = hero();

  it('shows a small round photo beside the name, with a webp source and a jpg fallback', () => {
    expect(html).toContain('class="hero__avatar"');
    expect(html).toContain('srcset="images/umer-avatar.webp"');
    expect(html).toContain('src="images/umer-avatar.jpg"');
  });
  it('reserves its size so the page does not shift while it loads, and loads it early', () => {
    expect(html).toMatch(/<img src="images\/umer-avatar\.jpg" alt="" width="88" height="88" fetchpriority="high"/);
  });
  it('keeps the photo out of the heading text (empty alt) while the name and alternate name stay in the h1', () => {
    const h1 = html.match(/<h1[\s\S]*?<\/h1>/)[0];
    expect(h1).toContain('alt=""');
    expect(h1).toContain(profile.name);
    expect(h1).toContain('Also known as Umer Lakhani');
  });
  it('the avatar files exist in public/', () => {
    for (const ext of ['jpg', 'webp']) expect(existsSync(resolve(import.meta.dirname, `../public/images/umer-avatar.${ext}`))).toBe(true);
  });
});
