// Learning Journey: a calm orange beam runs down a straight line of blue dots. It sticks to the dot of the step you have
// scrolled to, moves on with you when you reach the next one, and holds still when you stop. A few fainter lines and
// soft clouds of light sit around it. Without JavaScript, or with "reduce motion", every step is simply shown reached.
import { activeIndex, approach, beamTarget, lineOffsets } from './journey-path.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function initJourney() {
  const track = document.querySelector('[data-journey]');
  if (!track) return;
  const steps = [...track.querySelectorAll('[data-step]')];
  const nodes = steps.map((step) => step.querySelector('[data-node]'));
  const svg = track.querySelector('.journey__svg');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const reachAll = () => steps.forEach((step) => step.classList.add('is-lit'));
  if (!svg || !nodes.length) {
    reachAll();
    return;
  }

  const make = (tag, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };

  let geo = null;
  let head = 0; // current y of the beam head
  let running = false;

  function build() {
    const box = track.getBoundingClientRect();
    const rects = nodes.map((node) => node.getBoundingClientRect());
    const x = rects[0].left + rects[0].width / 2 - box.left;
    const nodeYs = rects.map((r) => r.top + r.height / 2 - box.top);
    const height = track.offsetHeight;
    const lastY = nodeYs.at(-1);

    svg.setAttribute('viewBox', `0 0 ${track.offsetWidth} ${height}`);
    svg.replaceChildren();
    svg.append(
      make('defs', {}),
    );
    const defs = svg.firstChild;
    defs.innerHTML = `<filter id="journey-soft" x="-200%" y="-20%" width="500%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="journey-halo" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="5"/></filter>`;

    // Faint track from the first dot to the last, and the soft clouds that drift around the beam head.
    svg.append(make('line', { class: 'journey__rail', x1: x, y1: nodeYs[0], x2: x, y2: lastY }));
    const clouds = [-1, 1, 0].map((side, i) => make('ellipse', { class: `journey__cloud journey__cloud--${i + 1}`, cx: x + side * 26, cy: 0, rx: 44 - i * 8, ry: 70 - i * 12, filter: 'url(#journey-soft)' }));
    svg.append(...clouds);

    // Three straight lines: the main beam and two fainter companions.
    const lines = lineOffsets().map((dx, i) =>
      make('line', { class: `journey__line journey__line--${i === 1 ? 'main' : 'side'}`, x1: x + dx, y1: nodeYs[0], x2: x + dx, y2: nodeYs[0] }));
    svg.append(...lines);

    const halo = make('circle', { class: 'journey__halo', cx: x, cy: nodeYs[0], r: 12, filter: 'url(#journey-halo)' });
    const tip = make('circle', { class: 'journey__tip', cx: x, cy: nodeYs[0], r: 4.5 });
    svg.append(halo, tip);
    geo = { x, nodeYs, height, lines, clouds, halo, tip, top: nodeYs[0] };
    head = Math.max(head, nodeYs[0]);
  }

  function paint() {
    const y = Math.max(head, geo.top);
    geo.lines.forEach((line) => line.setAttribute('y2', y));
    geo.tip.setAttribute('cy', y);
    geo.halo.setAttribute('cy', y);
    geo.clouds.forEach((cloud, i) => cloud.setAttribute('cy', y + (i - 1) * 14));
  }

  function targetY() {
    const box = track.getBoundingClientRect();
    const reading = innerHeight * 0.55 - box.top;
    const index = activeIndex(geo.nodeYs, reading);
    steps.forEach((step, i) => step.classList.toggle('is-lit', i <= index));
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    track.classList.toggle('is-moving', running);
    return Math.max(beamTarget(geo.nodeYs, index), geo.top);
  }

  // The beam eases toward the active dot a little every frame, and the loop stops as soon as it has arrived.
  function tick() {
    const target = targetY();
    head = reduce.matches ? target : approach(head, target);
    paint();
    if (head !== target) {
      running = true;
      requestAnimationFrame(tick);
    } else {
      running = false;
      track.classList.remove('is-moving');
    }
  }

  const wake = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };

  const rebuild = () => {
    build();
    paint();
    wake();
  };

  build();
  paint();
  wake();
  addEventListener('scroll', wake, { passive: true });
  let timer;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  }).observe(track);
  addEventListener('load', rebuild, { once: true });
}
