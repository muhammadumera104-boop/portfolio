import { about, profile, ticker, skills } from '../../data/content.js';
import { esc, list, heading } from '../util.js';

export const marquee = () => {
  const set = (hidden) => `<ul class="ticker__set"${hidden ? ' aria-hidden="true"' : ' aria-label="Technologies and topics"'}>${list(ticker, (t) => `<li>${esc(t)}</li>`)}</ul>`;
  return `<div class="ticker" data-ticker><div class="ticker__track">${set(false)}${set(true)}</div></div>`;
};

const portrait = () =>
  profile.portrait
    ? `<figure class="about__portrait" data-reveal>
        <div class="about__portrait-frame">
          <picture>
            <source srcset="${esc(profile.portrait.replace(/\.(jpe?g|png)$/i, '.webp'))}" type="image/webp">
            <img src="${esc(profile.portrait)}" alt="${esc(profile.portraitAlt)}" width="600" height="720" loading="lazy" decoding="async">
          </picture>
        </div>
        <figcaption class="label">${esc(profile.name)} · ${esc(profile.location)}</figcaption>
      </figure>`
    : '';

export const aboutSection = () => `
<section class="section about" id="about" aria-labelledby="about-title">
  <div class="container">
    ${heading({ index: '01', label: 'About', id: 'about-title', lines: ['Curiosity, backed by', '<em>strong foundations.</em>'] })}
    <div class="about__grid">
      <div class="about__copy">
        ${portrait()}
        <p class="about__lead" data-reveal>${esc(about.lead)}</p>
        <div class="about__text" data-reveal>${list(about.paragraphs, (p) => `<p>${esc(p)}</p>`)}</div>
        <dl class="facts" data-reveal>${list(about.facts, (f) => `<div class="facts__row"><dt class="label">${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)}</dl>
      </div>
      <div class="about__console" data-reveal>
        <div class="terminal" data-terminal>
          <div class="terminal__bar">
            <span class="terminal__lights" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="label">umer@portfolio: ~</span>
          </div>
          <div class="terminal__out" data-terminal-output role="log" aria-live="polite" aria-label="Terminal output" tabindex="0">
            <p>Welcome to M. Umer’s portfolio console.</p>
            <p>Type <b>help</b> to list commands, or tap one below.</p>
          </div>
          <form class="terminal__form" data-terminal-form>
            <label for="terminal-input">umer@portfolio:~$</label>
            <input id="terminal-input" name="command" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="type a command">
          </form>
          <div class="terminal__chips" aria-label="Suggested commands">
            ${list(['help', 'whoami', 'skills', 'projects', 'contact'], (c) => `<button type="button" class="terminal__chip" data-command="${c}">${c}</button>`)}
          </div>
        </div>
        <p class="about__note">A note to visitors: I’m early in my journey. If you have an internship or a learning-focused project, I’d love to connect.</p>
      </div>
    </div>
  </div>
</section>`;

const levels = { practiced: 'Practiced', learning: 'Learning', exploring: 'Exploring' };

// `reveal` is false when rows are swapped in after load (the scroll-reveal pass already ran).
export const skillRows = (items, reveal = true) => list(items, (s, i) => `
      <li class="skill-row"${reveal ? ' data-reveal' : ''}>
        <span class="skill-row__num label">${String(i + 1).padStart(2, '0')}</span>
        <div class="skill-row__head">
          <h3 class="skill-row__group">${esc(s.group)}</h3>
          <p class="skill-row__note">${esc(s.note)}</p>
        </div>
        <ul class="chips">${list(s.items, (item) => `<li class="chip chip--${s.level}">${esc(item)}</li>`)}</ul>
        <span class="skill-row__level label level--${s.level}">${levels[s.level] || ''}</span>
      </li>`);

export const skillsSection = () => `
<section class="section skills" id="skills" aria-labelledby="skills-title">
  <div class="container">
    ${heading({ index: '02', label: 'Skills & learning', id: 'skills-title', lines: ['Foundations first.', '<em>The web,</em> next.'] })}
    <div class="skills__legend" data-reveal>
      ${list(Object.entries(levels), ([key, text]) => `<span class="legend-item"><span class="chip chip--${key} chip--swatch" aria-hidden="true"></span>${text}</span>`)}
    </div>
    <ol class="skills__list" data-skills-list>
      ${skillRows(skills)}
    </ol>
  </div>
</section>`;
