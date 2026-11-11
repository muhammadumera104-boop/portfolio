import { testimonials } from '../../data/content.js';
import { cleanTestimonials } from '../../shared/testimonials.js';
import { esc, list, arrow, heading, external } from '../util.js';

/**
 * Short quotes from real people. The section is left out completely when there are no valid entries, so the site
 * never shows an empty heading or made-up praise. Add entries to `testimonials` in src/data/content.js.
 */
export const testimonialsSection = (items = testimonials) => {
  const shown = cleanTestimonials(items);
  if (shown.length === 0) return '';
  return `
<section class="section testimonials" id="testimonials" aria-labelledby="testimonials-title">
  <div class="container">
    ${heading({ index: 'Words', label: 'Testimonials', id: 'testimonials-title', lines: ['Words from', '<em>people</em> I work with.'] })}
    <ul class="testimonials__list">
      ${list(shown, (t) => `
      <li class="testimonial" data-reveal>
        <figure class="testimonial__figure">
          <blockquote class="testimonial__quote" cite="${esc(t.url)}"><p>${esc(t.quote)}</p></blockquote>
          <figcaption class="testimonial__who">
            ${external(t.url, `<strong class="testimonial__name">${esc(t.name)}</strong> ${arrow('ne')}`, 'testimonial__link')}
            <span class="testimonial__role label">${esc(t.role)}</span>
          </figcaption>
        </figure>
      </li>`)}
    </ul>
  </div>
</section>`;
};
