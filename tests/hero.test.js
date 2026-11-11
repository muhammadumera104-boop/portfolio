import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { hero } from '../src/render/sections/hero.js';
import { profile } from '../src/data/content.js';
import { leanOffset } from '../src/scripts/hero-fx-math.js';

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
  it('wraps the photo in a decorative orbit: glow, ring and four language chips, hidden from screen readers', () => {
    expect(html).toMatch(/<span class="hero__orbit" data-orbit aria-hidden="true">/);
    expect(html.match(/class="orbit__chip"/g)).toHaveLength(4);
    expect(html).toContain('class="hero__spot"');
  });
  it('the photo leans toward the cursor by a small, capped amount', () => {
    expect(leanOffset(0, 0)).toEqual({ dx: 0, dy: 0 });
    const near = leanOffset(80, 0);
    expect(near.dx).toBeGreaterThan(0);
    expect(near.dy).toBe(0);
    const far = leanOffset(5000, 5000);
    expect(Math.hypot(far.dx, far.dy)).toBeCloseTo(7, 5);
    expect(leanOffset(-100, 0).dx).toBeLessThan(0);
  });
  it('the avatar files exist in public/', () => {
    for (const ext of ['jpg', 'webp']) expect(existsSync(resolve(import.meta.dirname, `../public/images/umer-avatar.${ext}`))).toBe(true);
  });
});
