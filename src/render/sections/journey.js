import { journey } from '../../data/content.js';
import { esc, list, heading } from '../util.js';

/**
 * The learning journey as a vertical timeline. The SVG with the beam is added by scripts/journey.js (it needs the
 * measured positions of the nodes); the timeline itself is plain HTML, so it reads fine without JavaScript.
 */
export const journeySection = () => `
<section class="section journey inverse" id="journey" aria-labelledby="journey-title">
  <div class="container">
    ${heading({ index: 'Path', label: 'Learning journey', id: 'journey-title', lines: ['From C to the web,', '<em>one step at a time.</em>'] })}
    <p class="journey__intro">Scroll down: the light follows my path and stops at each step, from the first lines of C to the web and beyond.</p>
    <div class="journey__track" data-journey>
      <svg class="journey__svg" aria-hidden="true" focusable="false"></svg>
      <ol class="journey__steps">
        ${list(journey, (s) => `
        <li class="journey__step${s.current ? ' is-current' : ''}" data-step>
          <span class="journey__node" data-node aria-hidden="true"></span>
          <div class="journey__card">
            <p class="label journey__when">${esc(s.when)}${s.current ? ' <span class="journey__now">Learning now</span>' : ''}</p>
            <h3 class="journey__title">${esc(s.title)}</h3>
            <p class="journey__place">${esc(s.place)}</p>
            <p class="journey__text">${esc(s.text)}</p>
            <ul class="chips chips--inverse" aria-label="Topics">${list(s.tech, (t) => `<li class="chip">${esc(t)}</li>`)}</ul>
          </div>
        </li>`)}
      </ol>
    </div>
  </div>
</section>`;
