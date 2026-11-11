import { leanOffset } from './hero-fx-math.js';

/**
 * Pointer effects for the hero, inspired by playful portfolio sites but written from scratch:
 *  - the photo leans a little toward the cursor,
 *  - a soft light follows the cursor inside the hero,
 *  - a small ring ripples where you click.
 * Only for mouse-like pointers and only when motion is allowed; touch and reduced-motion get the static page.
 */
export function initHeroFx() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!motion.matches || !fine.matches) return;

  const orbit = hero.querySelector('[data-orbit]');
  let frame = 0;
  let pending = null;

  const apply = () => {
    frame = 0;
    if (!pending) return;
    const { x, y } = pending;
    hero.style.setProperty('--mx', `${x - hero.getBoundingClientRect().left}px`);
    hero.style.setProperty('--my', `${y - hero.getBoundingClientRect().top}px`);
    if (orbit) {
      const r = orbit.getBoundingClientRect();
      const { dx, dy } = leanOffset(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      orbit.style.setProperty('--ox', `${dx.toFixed(2)}px`);
      orbit.style.setProperty('--oy', `${dy.toFixed(2)}px`);
    }
  };

  hero.addEventListener('pointermove', (event) => {
    pending = { x: event.clientX, y: event.clientY };
    hero.classList.add('is-lit');
    if (!frame) frame = requestAnimationFrame(apply);
  });
  hero.addEventListener('pointerleave', () => {
    hero.classList.remove('is-lit');
    pending = null;
    if (orbit) {
      orbit.style.setProperty('--ox', '0px');
      orbit.style.setProperty('--oy', '0px');
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('input, textarea, select, video')) return;
    const ring = document.createElement('span');
    ring.className = 'fx-ripple';
    ring.setAttribute('aria-hidden', 'true');
    ring.style.left = `${event.clientX}px`;
    ring.style.top = `${event.clientY}px`;
    ring.addEventListener('animationend', () => ring.remove());
    document.body.append(ring);
  });
}
