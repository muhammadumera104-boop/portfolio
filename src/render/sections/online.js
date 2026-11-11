import { featuredRepos, links, profile } from '../../data/content.js';
import { esc, list, arrow } from '../util.js';

const github = links.find((l) => l.label === 'GitHub');
const linkedin = links.find((l) => l.label === 'LinkedIn');

/** A picture card: the whole card is one link, so clicking the picture (or anything on it) opens the repository. */
const repoCard = (r) => `
<li>
  <a class="repo-card" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
    <span class="repo-card__media"><img src="${esc(r.image)}" alt="${esc(r.alt)}" width="960" height="600" loading="lazy" decoding="async"></span>
    <span class="repo-card__body">
      <span class="label repo-card__meta">GitHub · ${esc(r.language)} · ${esc(r.name)}</span>
      <span class="repo-card__title">${esc(r.title)}</span>
      <span class="repo-card__text">${esc(r.text)}</span>
      <span class="repo-card__tags">${list(r.tags, (t) => `<span class="chip">${esc(t)}</span>`)}</span>
      <span class="repo-card__cta">Open the repository ${arrow('ne')}<span class="sr-only"> (opens in a new tab)</span></span>
    </span>
  </a>
</li>`;

const avatarSrc = profile.avatar || profile.portrait;

export const onlineSection = () => `
<section class="section online" id="online" aria-labelledby="online-title">
  <div class="container">
    <p class="label section-head__label"><span class="section-head__index">(Online)</span> Code and profiles</p>
    <h2 class="online__title" id="online-title">Find my work <em>on GitHub.</em></h2>
    <p class="online__intro">A few of my repositories. Click a picture to open it on GitHub.</p>
    <ul class="repo-grid">${list(featuredRepos, repoCard)}</ul>
    <div class="online__profiles">
      <a class="btn btn--ink" href="${esc(github.href)}" target="_blank" rel="noopener noreferrer me">All repositories on GitHub ${arrow('ne')}<span class="sr-only"> (opens in a new tab)</span></a>
      <a class="profile-card" href="${esc(linkedin.href)}" target="_blank" rel="noopener noreferrer me">
        <img class="profile-card__photo" src="${esc(avatarSrc)}" alt="" width="64" height="64" loading="lazy" decoding="async">
        <span class="profile-card__text">
          <span class="profile-card__name">${esc(profile.name)}</span>
          <span class="profile-card__headline">Computer science student · GU TECH, ${esc(profile.location.split(',')[0])}</span>
        </span>
        <span class="profile-card__cta">View my LinkedIn profile ${arrow('ne')}<span class="sr-only"> (opens in a new tab)</span></span>
      </a>
    </div>
  </div>
</section>`;
