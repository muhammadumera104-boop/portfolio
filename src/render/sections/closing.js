import { approach, education, recognition, contact, profile, links, nav } from '../../data/content.js';
import { esc, list, arrow, heading, external } from '../util.js';

export const approachSection = () => `
<section class="section approach" id="approach" aria-labelledby="approach-title">
  <div class="container approach__grid">
    <div class="approach__intro">
      ${heading({ index: '04', label: 'How I work', id: 'approach-title', lines: ['Small steps,', '<em>steady</em> progress.'] })}
      <p class="approach__text" data-reveal>Every project above followed the same loop. It is simple on purpose — it keeps the work honest and the code understandable.</p>
    </div>
    <ol class="steps">
      ${list(approach.steps, (s, i) => `
      <li class="step step--${i + 1}" style="--i:${i}">
        <span class="step__num">${s.number}</span>
        <h3 class="step__title">${esc(s.title)}</h3>
        <p class="step__text">${esc(s.text)}</p>
      </li>`)}
    </ol>
  </div>
  <div class="container">
    <ul class="habits">
      ${list(approach.habits, (h, i) => `
      <li class="habit" data-reveal>
        <span class="label">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="habit__title">${esc(h.title)}</h3>
        <p>${esc(h.text)}</p>
      </li>`)}
    </ul>
  </div>
</section>`;

// Shared by the build-time render and the Firestore hydration (reveal=false after load).
export const timelineRows = (items, reveal = true) => list(items, (e) => `
      <li class="timeline__row"${reveal ? ' data-reveal' : ''}>
        <p class="timeline__period label">${esc(e.period)}${e.note ? ` <span class="timeline__note">${esc(e.note)}</span>` : ''}</p>
        <h3 class="timeline__title">${esc(e.title)}</h3>
        <p class="timeline__place">${esc(e.place)}</p>
        <p class="timeline__text">${esc(e.text)}</p>
      </li>`);

export const recognitionItems = (items, reveal = true) => list(items, (r) => `
      <div class="recognition__item"${reveal ? ' data-reveal' : ''}>
        <p class="label">${esc(r.label)}</p>
        <h3 class="recognition__title">${esc(r.title)}</h3>
        <p class="recognition__place">${esc(r.place)}</p>
        <p>${esc(r.text)}</p>
      </div>`);

export const educationSection = () => `
<section class="section education" id="education" aria-labelledby="education-title">
  <div class="container">
    ${heading({ index: '05', label: 'Education & recognition', id: 'education-title', lines: ['Learning', '<em>with</em> purpose.'] })}
    <ol class="timeline" data-timeline>
      ${timelineRows(education)}
    </ol>
    <div class="recognition" data-recognition>
      ${recognitionItems(recognition)}
      <div class="recognition__item recognition__cv" data-reveal>
        <p class="label">Résumé</p>
        <p>A print-ready CV is generated from this page.</p>
        <button class="btn btn--line" type="button" data-print>Save CV as PDF ${arrow('down')}</button>
      </div>
    </div>
  </div>
</section>`;

export const contactSection = () => `
<section class="contact" id="contact" aria-labelledby="contact-title">
  <div class="container contact__grid">
    <div class="contact__lead">
      <p class="label section-head__label"><span class="section-head__index">(06)</span> Contact</p>
      <h2 class="contact__title" id="contact-title" data-lines><span class="line"><span class="line__inner">Let’s</span></span><span class="line"><span class="line__inner">talk.</span></span></h2>
      <p class="contact__intro">${esc(contact.intro)}</p>
      <a class="contact__email" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
      <ul class="contact__social">${list(links, (l) => `<li>${external(l.href, `${esc(l.label)} ${arrow('ne')}`, 'link-arrow')}</li>`)}</ul>
      <div class="contact__audiences">
        ${list(contact.audiences, (a) => `<div><h3 class="label">${esc(a.title)}</h3><p>${esc(a.text)}</p></div>`)}
      </div>
    </div>
    <form class="contact-form" data-contact-form novalidate>
      <h3 class="contact-form__title">Write a message</h3>
      <p class="contact-form__note">Your message is saved to my inbox. If saving fails, the form falls back to opening your email app.</p>
      <div class="field">
        <label for="c-name">Your name</label>
        <input id="c-name" name="name" autocomplete="name" minlength="2" maxlength="80" required>
        <p class="field__error" id="c-name-err"></p>
      </div>
      <div class="field">
        <label for="c-email">Email address</label>
        <input id="c-email" name="email" type="email" autocomplete="email" maxlength="120" required>
        <p class="field__error" id="c-email-err"></p>
      </div>
      <div class="field field--trap" aria-hidden="true">
        <label for="c-website">Leave this empty</label>
        <input id="c-website" name="website" tabindex="-1" autocomplete="off">
      </div>
      <div class="field">
        <label for="c-message">Message</label>
        <textarea id="c-message" name="message" rows="5" minlength="10" maxlength="4000" required></textarea>
        <p class="field__error" id="c-message-err"></p>
      </div>
      <button class="btn btn--ink" type="submit">Send message ${arrow('ne')}</button>
      <p class="contact-form__status" data-form-status role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;

export const footer = (base = '') => `
<footer class="site-footer inverse">
  <div class="container site-footer__grid">
    <p class="site-footer__statement">Thanks for scrolling this far. The best way to reach me is email.</p>
    <nav aria-label="Footer"><ul class="site-footer__list">${list(nav, (n) => `<li><a href="${n.href.startsWith('#') ? base + n.href : n.href}">${esc(n.label)}</a></li>`)}</ul></nav>
    <ul class="site-footer__list">
      <li><a href="mailto:${esc(profile.email)}">Email</a></li>
      ${list(links, (l) => `<li>${external(l.href, esc(l.label))}</li>`)}
    </ul>
    <div class="site-footer__meta">
      <p>© <span data-year>2026</span> ${esc(profile.name)}</p>
      <p>${esc(profile.location)}</p>
      <a class="link-arrow" href="${base}#home">Back to top ${arrow('up')}</a>    </div>
  </div>
  <p class="site-footer__wordmark" aria-hidden="true">M<span>.</span>Umer</p>
</footer>`;
