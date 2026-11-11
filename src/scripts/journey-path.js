// Maths for the Learning Journey beam. Pure functions so the behaviour can be tested without a browser.
// The beam is a straight vertical line that "sticks" to the dot of the step the visitor has reached, moves on when they
// scroll to the next one, and stays put when they stop.

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * Which step is active: the last one whose dot is at or above the reading line (so the beam waits on the first dot
 * until the visitor reaches it, then holds each dot while its card is in view).
 * @param {number[]} nodeYs  y of each dot, relative to the top of the track
 * @param {number} readingY  y of the reading line, relative to the top of the track
 * @returns {number} index of the active step, or -1 before the first one
 */
export function activeIndex(nodeYs, readingY) {
  let active = -1;
  nodeYs.forEach((y, i) => {
    if (y <= readingY) active = i;
  });
  return active;
}

/** One easing step toward a target: moves a fraction of the remaining distance, and lands exactly when close. */
export function approach(current, target, factor = 0.14, epsilon = 0.4) {
  const gap = target - current;
  return Math.abs(gap) <= epsilon ? target : current + gap * factor;
}

/**
 * Where the beam should end for a given active step: on that dot's centre, or at the very top when no step is reached.
 * @returns {number} y relative to the track
 */
export const beamTarget = (nodeYs, index) => (index < 0 ? 0 : nodeYs[index]);

/** Position of the three parallel lines: the main beam in the middle and two fainter companions either side. */
export const lineOffsets = (spread = 7) => [-spread, 0, spread];
