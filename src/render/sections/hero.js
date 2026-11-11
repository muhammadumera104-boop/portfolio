import { profile, foundations } from '../../data/content.js';
import { esc, list, arrow } from '../util.js';

// Isometric slab geometry for the "foundations" illustration (viewBox 560 × 440).
const CX = 200, A = 150, B = 75, T = 34, STEP = 58, BASE_Y = 318;
const glyphs = ['C', 'C++', 'PY', 'WEB'];

const slab = (layer, i) => {
  const y = BASE_Y - i * STEP;
  const top = `${CX - A},${y} ${CX},${y - B} ${CX + A},${y} ${CX},${y + B}`;
  const left = `${CX - A},${y} ${CX},${y + B} ${CX},${y + B + T} ${CX - A},${y + T}`;
  const right = `${CX},${y + B} ${CX + A},${y} ${CX + A},${y + T} ${CX},${y + B + T}`;
  return `
    <g class="slab-depth" style="--d:${(i + 1) * 6}">
      <g class="slab${layer.current ? ' slab--current' : ''}" data-slab>
        <polygon class="slab__left" points="${left}"/>
        <polygon class="slab__right" points="${right}"/>
        <polygon class="slab__top" points="${top}"/>
        <text class="slab__glyph" transform="translate(${CX} ${y}) matrix(1 .5 -1 .5 0 0)" x="-58" y="14">${esc(glyphs[i] ?? '')}</text>
        <path class="slab__leader" d="M${CX + A} ${y + T / 2}h34"/>
        <circle class="slab__node" cx="${CX + A + 34}" cy="${y + T / 2}" r="3"/>
      </g>
    </g>`;
};

// Round photo beside the name. It is decorative here (the name is right next to it and the About section has the
// full portrait with its alt text), so it stays out of the heading's accessible text.
const avatar = () =>
  profile.avatar
    ? `<picture class="hero__avatar"><source srcset="${esc(profile.avatar.replace(/.(jpe?g|png)$/i, '.webp'))}" type="image/webp"><img src="${esc(profile.avatar)}" alt="" width="88" height="88" fetchpriority="high" decoding="async"></picture>`
    : '';

export const hero = () => `
<section class="hero" id="home" aria-labelledby="hero-title">
  <div class="hero__columns" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
  <div class="container hero__inner">
    <div class="hero__meta" data-hero-fade>
      <p class="label">Student portfolio</p>
      <p class="label">BSCS · GU Tech</p>
      <p class="label">${esc(profile.location)}</p>
      <p class="label hero__status"><span class="status-dot" aria-hidden="true"></span>Open to internships</p>
    </div>

    <h1 class="hero__title" id="hero-title">
      <span class="hero__name" data-hero-fade>
        ${avatar()}
        <span class="hero__name-text">
          <span class="hero__name-main">${esc(profile.name)}<span class="sr-only"> — </span></span>
          ${profile.alsoKnownAs ? `<span class="hero__aka label">Also known as ${esc(profile.alsoKnownAs)}<span class="sr-only"> — </span></span>` : ''}
        </span>
      </span>
      <span class="hero__line hero__line--1"><span class="line"><span class="line__inner" data-hero-line>Software,</span></span></span>
      <span class="hero__line hero__line--2">
        <span class="line hero__serif"><span class="line__inner" data-hero-line><em>from the</em></span></span>
        <span class="line"><span class="line__inner" data-hero-line>ground up.</span></span>
      </span>
    </h1>

    <figure class="hero__stack stack" data-stack>
      <svg class="stack__svg" viewBox="0 0 560 440" role="img" aria-labelledby="stack-title stack-desc">
        <title id="stack-title">Learning stack</title>
        <desc id="stack-desc">Four stacked blocks showing the order in which Umer learned: C at the base, then C++ and object-oriented programming, then Python, and HTML, CSS and JavaScript on top, which he is learning now.</desc>
        <ellipse class="stack__shadow" cx="${CX}" cy="${BASE_Y + B + T + 6}" rx="${A + 10}" ry="10"/>
        ${[...foundations].map(slab).join('')}
      </svg>
      <ol class="stack__legend" aria-hidden="true">
        ${list(foundations, (layer, i) => `<li class="stack__item${layer.current ? ' is-current' : ''}" style="--y:${(((BASE_Y - i * STEP + T / 2) / 440) * 100).toFixed(2)}%" data-stack-item><b>${esc(layer.label)}</b><span>${esc(layer.note)}</span></li>`)}
      </ol>
      <figcaption class="sr-only">Learning path: ${foundations.map((l) => `${l.label} (${l.note})`).join(', ')}.</figcaption>
    </figure>

    <div class="hero__foot" data-hero-fade>
      <p class="hero__intro">Computer science student building strong foundations — from C and C++ to Python, and now the web.</p>
      <div class="hero__cta">
        <a class="btn btn--ink" href="#projects">View projects ${arrow('down')}</a>
        <a class="btn btn--line" href="#contact">Get in touch ${arrow('ne')}</a>
      </div>
      <p class="hero__exploring">
        <span class="label">Currently exploring</span>
        <span class="cycle" data-cycle aria-hidden="true">${list(profile.exploring, (word, i) => `<span class="cycle__word${i === 0 ? ' is-active' : ''}">${esc(word)}</span>`)}</span>
        <span class="sr-only">${esc(profile.exploring.join(', '))}</span>
      </p>
    </div>
    <a class="hero__scroll label" href="#about" data-hero-fade>Scroll <span class="hero__scroll-line" aria-hidden="true"></span></a>
  </div>
</section>`;
