import { describe, it, expect } from 'vitest';
import { activeIndex, approach, beamTarget, lineOffsets, clamp } from '../src/scripts/journey-path.js';
import { journeySection } from '../src/render/sections/journey.js';
import { journey, nav, education } from '../src/data/content.js';

describe('journey beam: sticks to the dot of the step you have reached', () => {
  const nodeYs = [100, 400, 700, 1000];

  it('waits at the top until the first dot reaches the reading line', () => {
    expect(activeIndex(nodeYs, 50)).toBe(-1);
    expect(beamTarget(nodeYs, -1)).toBe(0);
  });
  it('holds each dot while the reading line is between it and the next one', () => {
    expect(activeIndex(nodeYs, 100)).toBe(0);
    expect(activeIndex(nodeYs, 399)).toBe(0);
    expect(activeIndex(nodeYs, 400)).toBe(1);
    expect(activeIndex(nodeYs, 850)).toBe(2);
  });
  it('stays on the last dot once the end is reached, and goes back when scrolling up', () => {
    expect(activeIndex(nodeYs, 5000)).toBe(3);
    expect(activeIndex(nodeYs, 450)).toBe(1);
  });
  it('the beam ends exactly on the centre of the active dot', () => {
    nodeYs.forEach((y, i) => expect(beamTarget(nodeYs, i)).toBe(y));
  });
  it('moves toward the next dot a little each frame, and does not move when it is already there (it stops)', () => {
    let y = 100;
    const target = 400;
    const seen = [];
    for (let i = 0; i < 200 && y !== target; i += 1) {
      const next = approach(y, target);
      expect(next).toBeGreaterThan(y);
      expect(next).toBeLessThanOrEqual(target);
      seen.push(next);
      y = next;
    }
    expect(y).toBe(target); // lands exactly, never overshoots
    expect(seen.length).toBeLessThan(120); // and arrives within about two seconds at 60 frames per second
    expect(approach(target, target)).toBe(target);
  });
  it('also eases back up when the target is above', () => {
    expect(approach(400, 100)).toBeLessThan(400);
  });
  it('is a straight line: three parallel lines, the main beam in the middle', () => {
    expect(lineOffsets(7)).toEqual([-7, 0, 7]);
    expect(lineOffsets()).toHaveLength(3);
  });
  it('clamps values', () => {
    expect(clamp(5)).toBe(1);
    expect(clamp(-1)).toBe(0);
    expect(clamp(0.4)).toBe(0.4);
  });
});

describe('journey section', () => {
  const html = journeySection();

  it('lists every step as a list item with a node, a title and its topics', () => {
    expect(html.match(/data-step/g)).toHaveLength(journey.length);
    expect(html.match(/data-node/g)).toHaveLength(journey.length);
    expect(html.match(/<h3 class="journey__title">/g)).toHaveLength(journey.length);
    expect(html).toContain('<ol class="journey__steps">');
  });
  it('has a single h2, keeps the beam svg decorative, and marks the step being learned now', () => {
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain('class="journey__svg" aria-hidden="true"');
    expect(html.match(/Learning now/g)).toHaveLength(1);
    expect(journey.filter((s) => s.current)).toHaveLength(1);
  });
  it('uses the university name GU TECH and the real education dates', () => {
    expect(html).toContain('BSCS at GU TECH');
    expect(html).not.toContain('GU Tech');
    for (const e of education) expect(journey.some((s) => s.title.startsWith(e.title.split(' ')[0]) || s.when.includes(e.period))).toBe(true);
  });
  it('says the light stops at each step, escapes text, and has a nav item pointing at it', () => {
    expect(html).toContain('stops at each step');
    expect(html).not.toMatch(/<script/i);
    expect(nav.some((n) => n.href === '#journey')).toBe(true);
  });
});

describe('introduction video section', () => {
  it('renders a captioned, lazy-loading player with a poster and the full transcript', async () => {
    const { introSection } = await import('../src/render/sections/intro.js');
    const { introVideo } = await import('../src/data/content.js');
    const html = introSection();
    expect(html).toContain('<video class="intro-video__player" controls playsinline preload="none"');
    expect(html).toContain(`poster="${introVideo.poster}"`);
    expect(html).toContain('<track kind="captions" srclang="en" label="English"');
    expect(html.match(/<li>/g)).toHaveLength(introVideo.transcript.length);
    expect(html).toContain('Read the transcript');
  });
  it('uses the university name GU TECH in the narration', async () => {
    const { introVideo } = await import('../src/data/content.js');
    const all = introVideo.transcript.join(' ');
    expect(all).toContain('GU TECH');
    expect(all).not.toContain('GU Tech');
    expect(introVideo.duration).toMatch(/^PT\d+M\d+S$/);
  });
  it('adds a VideoObject to the home page data only when a video file is set', async () => {
    const { homeJsonLd } = await import('../src/shared/seo.js');
    const { introVideo } = await import('../src/data/content.js');
    const types = (video) => homeJsonLd('https://example.com', { video })['@graph'].map((n) => n['@type']);
    expect(types(introVideo)).toContain('VideoObject');
    expect(types({ ...introVideo, src: '' })).not.toContain('VideoObject');
    const node = homeJsonLd('https://example.com', { video: introVideo })['@graph'].find((n) => n['@type'] === 'VideoObject');
    expect(node.contentUrl).toBe(`https://example.com${introVideo.src}`);
    expect(node.thumbnailUrl[0]).toBe(`https://example.com${introVideo.poster}`);
    expect(node.uploadDate).toBe('2026-11-11');
  });
});
