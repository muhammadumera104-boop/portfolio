/**
 * How far (in px) the photo leans toward the cursor, given the cursor's offset from the photo's centre.
 * The lean grows with distance but never goes past `max`, so the photo only nudges and never leaves its frame.
 */
export function leanOffset(dx, dy, max = 7, reach = 320) {
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return { dx: 0, dy: 0 };
  const strength = Math.min(distance / reach, 1) * max;
  return { dx: (dx / distance) * strength, dy: (dy / distance) * strength };
}
