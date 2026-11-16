// Motion layer 2 (see styles/motion-extras.css). Same GSAP instance as motion.js; nothing here runs for
// visitors who prefer reduced motion.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;

// Dark chapters dissolve in from the light page and back out again, scrubbed to the scroll position so
// scrolling up reverses it exactly.
function toneTransitions() {
  document.querySelectorAll('.inverse').forEach((section) => {
    // A run of neighbouring dark chapters fades in once at the start and out once at the end.
    if (!section.previousElementSibling?.classList.contains('inverse')) {
      gsap.fromTo(section, { '--dk-in': 0 }, {
        '--dk-in': 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 96%', end: 'top 38%', scrub: 0.4 },
      });
    }
    if (section.nextElementSibling && !section.nextElementSibling.classList.contains('inverse')) {
      gsap.fromTo(section, { '--dk-out': 1 }, {
        '--dk-out': 0,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'bottom 62%', end: 'bottom 4%', scrub: 0.4 },
      });
    }
  });
}

// Photo and project figures are unveiled by a mask that wipes upward.
function imageMasks() {
  gsap.utils.toArray('.about__portrait picture, .project__visual').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.3,
      ease: 'expo.inOut',
      clearProps: 'clipPath',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

// Skill chips pop in one after another, and timeline rules draw themselves.
function listReveals() {
  gsap.utils.toArray('.skill-row').forEach((row) => {
    gsap.from(row.querySelectorAll('.chip'), {
      autoAlpha: 0,
      scale: 0.8,
      y: 10,
      duration: 0.6,
      ease: 'back.out(1.6)',
      stagger: 0.05,
      clearProps: 'opacity,visibility,transform',
      scrollTrigger: { trigger: row, start: 'top 88%', once: true },
    });
  });
  ScrollTrigger.batch('.timeline__row', {
    start: 'top 88%',
    once: true,
    onEnter: (rows) => rows.forEach((row, i) => setTimeout(() => row.classList.add('is-drawn'), i * 150)),
  });
}

// 3D tilt with a glare that follows the pointer, for mouse users only.
function projectTilt() {
  root.classList.add('fx-tilt');
  document.querySelectorAll('.project__visual').forEach((visual) => {
    let frame = 0;
    const MAX = 5;
    visual.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = visual.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        visual.classList.add('is-tilting');
        visual.style.setProperty('--ry', `${((x - 0.5) * 2 * MAX).toFixed(2)}deg`);
        visual.style.setProperty('--rx', `${((0.5 - y) * 2 * MAX).toFixed(2)}deg`);
        visual.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        visual.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
    });
    visual.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      frame = 0;
      visual.classList.remove('is-tilting');
      visual.style.setProperty('--rx', '0deg');
      visual.style.setProperty('--ry', '0deg');
    });
  });
}

export function initMotionExtras() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('fx');
  toneTransitions();
  imageMasks();
  listReveals();
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) projectTilt();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
