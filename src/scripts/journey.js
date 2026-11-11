// Learning Journey: a bolt of lightning runs down the timeline as the visitor scrolls, lighting each step as it
// reaches it. Progressive enhancement: without JavaScript, or with "reduce motion" turned on, every step is simply
// shown lit and nothing flickers.
import { boltPoints, forkPoints, toPath, progressFor } from './journey-path.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function initJourney() {
  const track = document.querySelector('[data-journey]');
  if (!track) return;
  const steps = [...track.querySelectorAll('[data-step]')];
  const nodes = steps.map((step) => step.querySelector('[data-node]'));
  const svg = track.querySelector('.journey__svg');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const lightAll = () => steps.forEach((step) => step.classList.add('is-lit'));
  if (reduce.matches || !svg || !nodes.length) {
    lightAll();
    track.classList.add('is-static');
    return;
  }

  const make = (tag, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };

  let geo = null;

  function build() {
    const box = track.getBoundingClientRect();
    const nodeRects = nodes.map((node) => node.getBoundingClientRect());
    const nodeX = nodeRects[0].left + nodeRects[0].width / 2 - box.left;
    const nodeYs = nodeRects.map((r) => r.top + r.height / 2 - box.top);
    const height = track.offsetHeight;

    svg.setAttribute('viewBox', `0 0 ${track.offsetWidth} ${height}`);
    svg.replaceChildren();

    const points = boltPoints({ height, nodeX, nodeYs });
    const d = toPath(points);
    svg.append(make('path', { class: 'journey__wire', d: `M${nodeX} 0 L${nodeX} ${height}` }));

    const forks = make('g', { class: 'journey__forks' });
    const forkEls = nodeYs.map((y, i) => {
      const fork = make('path', { d: toPath(forkPoints({ x: nodeX, y, direction: i % 2 ? -1 : 1, seed: i + 3 })) });
      forks.append(fork);
      return fork;
    });
    svg.append(forks);

    const glow = make('path', { class: 'journey__glow', d });
    const bolt = make('path', { class: 'journey__bolt', d });
    const spark = make('circle', { class: 'journey__spark', r: 6, cx: nodeX, cy: 0 });
    svg.append(glow, bolt, spark);

    const length = bolt.getTotalLength();
    [glow, bolt].forEach((path) => {
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });
    geo = { height, nodeYs, bolt, glow, spark, forkEls, length };
  }

  let lastProgress = -1;
  function update() {
    if (!geo) return;
    const box = track.getBoundingClientRect();
    const progress = progressFor({ top: box.top, height: box.height, anchor: innerHeight * 0.62 });
    if (progress === lastProgress) return;
    const moving = lastProgress >= 0;
    lastProgress = progress;

    const travelled = geo.length * progress;
    geo.bolt.style.strokeDashoffset = `${geo.length - travelled}`;
    geo.glow.style.strokeDashoffset = `${geo.length - travelled}`;
    const tip = geo.bolt.getPointAtLength(travelled);
    geo.spark.setAttribute('cx', tip.x);
    geo.spark.setAttribute('cy', tip.y);
    geo.spark.style.opacity = progress > 0 && progress < 1 ? '1' : '0';

    // Light each step once the bolt has passed its node. Stepping back up un-lights them again.
    const reachedY = geo.height * progress;
    steps.forEach((step, i) => {
      const lit = geo.nodeYs[i] <= reachedY;
      if (lit !== step.classList.contains('is-lit')) step.classList.toggle('is-lit', lit);
      geo.forkEls[i].style.opacity = lit ? '1' : '0';
    });

    // A little flicker while the bolt is moving, like a real discharge.
    if (moving) {
      geo.bolt.style.opacity = String(0.78 + Math.random() * 0.22);
      geo.glow.style.opacity = String(0.25 + Math.random() * 0.25);
    }
  }

  let queued = false;
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  const rebuild = () => {
    lastProgress = -1;
    build();
    update();
  };

  build();
  update();
  addEventListener('scroll', request, { passive: true });
  let timer;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  }).observe(track);
  // Fonts and images can move the steps after first paint.
  addEventListener('load', rebuild, { once: true });
  reduce.addEventListener?.('change', (event) => {
    if (event.matches) {
      lightAll();
      track.classList.add('is-static');
    }
  });
}
