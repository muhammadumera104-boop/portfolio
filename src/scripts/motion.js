// Motion system. GSAP owns: the intro, hero entrance, scroll reveals and parallax.
// CSS owns: hover states, the ticker, the word cycle transitions and the scroll cue.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Mirrors --ease-out / --dur-* in tokens.css.
const EASE = 'expo.out';
const EASE_IN_OUT = 'expo.inOut';
const DUR = { base: 0.42, slow: 0.8, long: 1.1 };

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

const ready = () => root.classList.add('motion-ready');

function shouldPlayIntro() {
  try {
    if (sessionStorage.getItem('umer-intro')) return false;
    sessionStorage.setItem('umer-intro', '1');
  } catch {
    return false;
  }
  return scrollY < 40 && !location.hash;
}

function buildIntro() {
  const el = document.createElement('div');
  el.className = 'intro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="intro__cols"><span></span><span></span><span></span><span></span></div>
    <p class="intro__mark"><span>M<b>.</b>Umer</span></p>
    <p class="intro__meta label"><span>Software, from the ground up</span></p>`;
  document.body.append(el);
  return el;
}

function heroEntrance() {
  const intro = shouldPlayIntro() ? buildIntro() : null;
  const tl = gsap.timeline({ defaults: { ease: EASE } });

  if (intro) {
    tl.from(intro.querySelectorAll('.intro__mark span, .intro__meta span'), { yPercent: 110, duration: DUR.slow, stagger: 0.08 })
      .to(intro.querySelectorAll('.intro__mark span, .intro__meta span'), { yPercent: -110, duration: 0.5, ease: 'power3.in', stagger: 0.04 }, '+=0.35')
      .to(intro.querySelectorAll('.intro__cols span'), { yPercent: -100, duration: 0.9, ease: EASE_IN_OUT, stagger: 0.07 }, '-=0.2')
      .add(() => intro.remove());

    // Any interaction skips straight to the hero.
    const skip = () => {
      if (tl.time() < tl.labels.hero) tl.seek('hero');
      intro.remove();
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => removeEventListener(t, skip));
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => addEventListener(t, skip, { passive: true }));
  }

  tl.addLabel('hero', intro ? '-=0.55' : 0)
    .from('[data-hero-line]', { yPercent: 110, duration: DUR.long, stagger: 0.09 }, 'hero')
    .from('[data-hero-fade]', { autoAlpha: 0, y: 16, duration: DUR.slow, stagger: 0.06 }, 'hero+=0.2')
    .from('[data-slab]', { y: -160, autoAlpha: 0, duration: 1, stagger: 0.12 }, 'hero+=0.1')
    .from('[data-stack-item]', { autoAlpha: 0, x: -12, duration: 0.6, stagger: 0.08 }, 'hero+=0.6');

  ready();
}

function reveals() {
  // Section headings: each line slides up out of its mask.
  gsap.utils.toArray('[data-lines]').forEach((title) => {
    if (title.closest('.hero')) return;
    gsap.from(title.querySelectorAll('.line__inner'), {
      yPercent: 105,
      duration: DUR.long,
      ease: EASE,
      stagger: 0.08,
      scrollTrigger: { trigger: title, start: 'top 88%', once: true },
    });
  });

  // Blocks fade up in small batches as they enter.
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: DUR.slow, ease: EASE, stagger: 0.08, overwrite: true }),
  });
}

function scrollEffects() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    gsap.to('.hero__stack', {
      yPercent: -14,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      gsap.fromTo(el, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    gsap.fromTo('.edu-figure__console', { y: 50 }, {
      y: -30,
      ease: 'none',
      scrollTrigger: { trigger: '.edu-figure', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  gsap.from('.site-footer__wordmark', {
    yPercent: 45,
    ease: 'none',
    scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}

// Hero illustration layers drift with the pointer at different depths (CSS reads --px/--py).
function stackParallax() {
  const hero = document.querySelector('.hero');
  const stack = document.querySelector('[data-stack]');
  if (!hero || !stack) return;
  let frame = 0;
  hero.addEventListener('pointermove', (event) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      stack.style.setProperty('--px', (event.clientX / innerWidth - 0.5).toFixed(3));
      stack.style.setProperty('--py', (event.clientY / innerHeight - 0.5).toFixed(3));
    });
  });
  hero.addEventListener('pointerleave', () => {
    stack.style.setProperty('--px', 0);
    stack.style.setProperty('--py', 0);
  });
}

// Small thumbnail that follows the cursor over the project index.
function projectPreview() {
  const card = document.querySelector('[data-preview-card]');
  const rows = document.querySelectorAll('[data-preview]');
  if (!card || !rows.length) return;
  const items = card.querySelectorAll('[data-preview-item]');
  const x = gsap.quickTo(card, 'x', { duration: 0.6, ease: 'power3' });
  const y = gsap.quickTo(card, 'y', { duration: 0.6, ease: 'power3' });

  rows.forEach((row) => {
    row.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      items.forEach((item) => item.classList.toggle('is-active', item.dataset.previewItem === row.dataset.preview));
      gsap.set(card, { x: event.clientX + 28, y: event.clientY - 60 });
      card.classList.add('is-visible');
    });
    row.addEventListener('pointermove', (event) => {
      x(event.clientX + 28);
      y(event.clientY - 60);
    });
    row.addEventListener('pointerleave', () => card.classList.remove('is-visible'));
  });
  addEventListener('scroll', () => card.classList.remove('is-visible'), { passive: true });
}

// "Currently exploring" words rotate in the hero.
function wordCycle() {
  const cycle = document.querySelector('[data-cycle]');
  if (!cycle) return;
  const words = [...cycle.children];
  let index = 0;
  setInterval(() => {
    if (document.hidden) return;
    const current = words[index];
    index = (index + 1) % words.length;
    current.classList.replace('is-active', 'is-leaving');
    words[index].classList.remove('is-leaving');
    words[index].classList.add('is-active');
    setTimeout(() => current.classList.remove('is-leaving'), 900);
  }, 2800);
}

export function initMotion() {
  if (reducedMotion.matches) {
    ready();
    return;
  }
  try {
    heroEntrance();
    reveals();
    scrollEffects();
    wordCycle();
    if (finePointer.matches) {
      stackParallax();
      projectPreview();
    }
    // Fonts change line heights; recalculate trigger positions once they are in.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  } catch (error) {
    // Never leave content hidden if an animation fails.
    document.querySelector('.intro')?.remove();
    gsap.set('[data-reveal], [data-hero-line], [data-hero-fade], [data-slab], [data-stack-item], .line__inner', { clearProps: 'all' });
    ready();
    console.error(error);
  }
}
