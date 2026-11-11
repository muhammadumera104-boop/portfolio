import { describe, it, expect } from 'vitest';
import { boltPoints, forkPoints, toPath, progressFor, seeded } from '../src/scripts/journey-path.js';
import { journeySection } from '../src/render/sections/journey.js';
import { journey, nav, education } from '../src/data/content.js';

describe('lightning geometry', () => {
  const options = { height: 900, nodeX: 32, nodeYs: [40, 220, 400, 610, 800] };
  const points = boltPoints(options);

  it('runs from the top of the track to the bottom, top to bottom in order', () => {
    expect(points[0].y).toBe(0);
    expect(points.at(-1).y).toBe(900);
    for (let i = 1; i < points.length; i += 1) expect(points[i].y).toBeGreaterThan(points[i - 1].y);
  });
  it('passes exactly through the centre of every step node', () => {
    for (const y of options.nodeYs) expect(points.find((p) => p.y === y).x).toBe(32);
  });
  it('zig-zags between the nodes but stays inside the gutter', () => {
    const between = points.filter((p) => !options.nodeYs.includes(p.y) && p.y !== 0 && p.y !== 900);
    expect(between.length).toBeGreaterThan(10);
    expect(between.some((p) => p.x !== 32)).toBe(true);
    for (const p of between) expect(Math.abs(p.x - 32)).toBeLessThanOrEqual(9);
  });
  it('is the same bolt every time (deterministic) and different for another seed', () => {
    expect(boltPoints(options)).toEqual(points);
    expect(boltPoints({ ...options, seed: 99 })).not.toEqual(points);
  });
  it('seeded numbers are between 0 and 1', () => {
    const random = seeded(5);
    for (let i = 0; i < 200; i += 1) {
      const v = random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('a fork starts on the bolt and leans the way it is told to', () => {
    const right = forkPoints({ x: 32, y: 100, direction: 1 });
    const left = forkPoints({ x: 32, y: 100, direction: -1 });
    expect(right[0]).toEqual({ x: 32, y: 100 });
    expect(right.at(-1).x).toBeGreaterThan(32);
    expect(left.at(-1).x).toBeLessThan(32);
    expect(right.at(-1).y).toBeGreaterThan(100);
  });
  it('turns points into SVG path data', () => {
    expect(toPath([{ x: 1, y: 2 }, { x: 3.14159, y: 4 }])).toBe('M1.0 2.0 L3.1 4.0');
  });
  it('progress is 0 before the track reaches the reading line and 1 once it has passed', () => {
    expect(progressFor({ top: 800, height: 1000, anchor: 500 })).toBe(0);
    expect(progressFor({ top: 0, height: 1000, anchor: 500 })).toBe(0.5);
    expect(progressFor({ top: -2000, height: 1000, anchor: 500 })).toBe(1);
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
  it('has a single h2, keeps the lightning svg decorative, and marks the step being learned now', () => {
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain('class="journey__svg" aria-hidden="true"');
    expect(html.match(/Learning now/g)).toHaveLength(1);
    expect(journey.filter((s) => s.current)).toHaveLength(1);
  });
  it('uses the university name GU TECH and the real education dates', () => {
    expect(html).toContain('BSCS at GU TECH');
    expect(html).not.toContain('GU Tech');
    for (const e of education) expect(journey.some((s) => s.title.startsWith(e.title.split(' ')[0]) || s.when.includes(e.period.replace(' — ', ' — ')))).toBe(true);
  });
  it('escapes text and has a nav item pointing at it', () => {
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
  it('uses the university name GU TECH in the narration and says nothing that is not on the site', async () => {
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
