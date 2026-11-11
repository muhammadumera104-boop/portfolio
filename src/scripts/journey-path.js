// Geometry for the lightning on the Learning Journey. Pure functions, so the shape can be tested: the bolt always passes
// exactly through the centre of every step's node, and zig-zags between them.

/** A small deterministic random generator (mulberry32), so the bolt looks the same on every visit. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Points of the main bolt, from the top of the track to the bottom.
 * @param {{height: number, nodeX: number, nodeYs: number[], step?: number, amplitude?: number, seed?: number}} options
 * @returns {{x: number, y: number}[]}
 */
export function boltPoints({ height, nodeX, nodeYs, step = 26, amplitude = 9, seed = 7 }) {
  const random = seeded(seed);
  const pinned = new Set(nodeYs.map((y) => Math.round(y)));
  const ys = new Set([0, Math.round(height), ...pinned]);
  for (let y = step; y < height; y += step) ys.add(Math.round(y));
  return [...ys]
    .sort((a, b) => a - b)
    .map((y) => {
      const onNode = pinned.has(y) || y === 0 || y === Math.round(height);
      return { x: onNode ? nodeX : nodeX + (random() * 2 - 1) * amplitude, y };
    });
}

/** A short branch that forks off the bolt at (x, y), with one kink in the middle. */
export function forkPoints({ x, y, direction = 1, seed = 1, length = 34 }) {
  const random = seeded(seed);
  const reach = length * (0.7 + random() * 0.6);
  const drop = 14 + random() * 22;
  return [
    { x, y },
    { x: x + direction * reach * 0.45, y: y + drop * 0.35 },
    { x: x + direction * reach * 0.35, y: y + drop * 0.65 },
    { x: x + direction * reach, y: y + drop },
  ];
}

/** SVG path data ("M x y L x y …") for a list of points. */
export const toPath = (points) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** How far (0 to 1) the bolt has travelled, for a track whose top edge is `top` px from the top of the viewport. */
export const progressFor = ({ top, height, anchor }) => Math.min(1, Math.max(0, (anchor - top) / height));
