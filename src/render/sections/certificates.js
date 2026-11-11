import { certificates, achievements } from '../../data/content.js';
import { cleanCertificates, cleanAchievements, formatDate } from '../../shared/credentials.js';
import { esc, list, arrow, heading, external } from '../util.js';

const when = (date) => `<p class="label credential__date"><time datetime="${esc(date)}">${esc(formatDate(date))}</time></p>`;

const certificateItem = (c) => `
      <li class="credential" data-reveal>
        ${when(c.date)}
        <h4 class="credential__title">${esc(c.title)}</h4>
        <p class="credential__issuer">${esc(c.issuer)}</p>
        ${c.url ? external(c.url, `Verify this certificate ${arrow('ne')}`, 'link-arrow credential__link') : ''}
      </li>`;

const achievementItem = (a) => `
      <li class="credential" data-reveal>
        ${when(a.date)}
        <h4 class="credential__title">${esc(a.title)}</h4>
        <p class="credential__text">${esc(a.detail)}</p>
        ${a.url ? external(a.url, `See the details ${arrow('ne')}`, 'link-arrow credential__link') : ''}
      </li>`;

/**
 * Certificates and achievements, each as a small dated card. A group with no valid entries is left out, and the whole
 * section is left out when both are empty, so the site never shows an empty heading or invented awards.
 * Add entries to `certificates` and `achievements` in src/data/content.js.
 */
export const certificatesSection = (certs = certificates, wins = achievements) => {
  const c = cleanCertificates(certs);
  const a = cleanAchievements(wins);
  if (c.length === 0 && a.length === 0) return '';
  return `
<section class="section credentials" id="certificates" aria-labelledby="certificates-title">
  <div class="container">
    ${heading({ index: 'Proof', label: 'Certificates & achievements', id: 'certificates-title', lines: ['Things I have', '<em>earned</em> and finished.'] })}
    ${c.length ? `<h3 class="credentials__group">Certificates</h3><ul class="credentials__list">${list(c, certificateItem)}</ul>` : ''}
    ${a.length ? `<h3 class="credentials__group">Achievements</h3><ul class="credentials__list">${list(a, achievementItem)}</ul>` : ''}
  </div>
</section>`;
};
