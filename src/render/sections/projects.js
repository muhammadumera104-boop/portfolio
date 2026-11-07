import { projects, webProjects } from '../../data/content.js';
import { esc, list, arrow, heading, external } from '../util.js';
import { figures, minis } from '../visuals.js';

const captions = {
  edutrack: 'Illustration of the program’s structure and console menu — not a screenshot.',
  pathfinder: 'Interactive sketch of the idea, written in JavaScript for this page. The original project is in Python.',
  heap: 'Interactive sketch of a free-list allocator, written in JavaScript for this page. The original study is in C.',
};

const projectIndex = () => `
<ol class="project-index">
  ${list(projects, (p) => `
  <li data-reveal>
    <a class="project-index__row" href="#project-${p.id}" data-preview="${p.id}">
      <span class="project-index__num label">${p.number}</span>
      <span class="project-index__title">${esc(p.title)}</span>
      <span class="project-index__kind label">${esc(p.kind)}</span>
      <span class="project-index__go">${arrow('down')}</span>
    </a>
  </li>`)}
</ol>
<div class="project-preview" data-preview-card aria-hidden="true">
  ${list(projects, (p) => `<div class="project-preview__item" data-preview-item="${p.id}">${minis[p.visual]}</div>`)}
</div>`;

const project = (p) => `
<article class="project project--${p.visual}" id="project-${p.id}" aria-labelledby="${p.id}-title">
  <div class="container project__grid">
    <header class="project__head" data-reveal>
      <p class="project__num" aria-hidden="true">${p.number}</p>
      <p class="label project__meta"><span>${esc(p.kind)}</span><span>${esc(p.status)}</span></p>
      <h3 class="project__title" id="${p.id}-title">${esc(p.title)}</h3>
      <p class="project__summary">${esc(p.summary)}</p>
    </header>
    <figure class="project__figure" data-reveal>
      <div class="project__visual"${p.visual === 'edutrack' ? ' data-parallax' : ''}>${figures[p.visual]()}</div>
      <figcaption class="project__caption label">${esc(captions[p.visual])}</figcaption>
    </figure>
    <div class="project__body" data-reveal>
      <div class="project__block">
        <h4 class="label">Problem</h4>
        <p>${esc(p.problem)}</p>
      </div>
      <div class="project__block">
        <h4 class="label">Implementation</h4>
        <ul class="project__details">${list(p.details, (d) => `<li>${esc(d)}</li>`)}</ul>
      </div>
      <div class="project__block">
        <h4 class="label">Outcome</h4>
        <p>${esc(p.outcome)}</p>
        <ul class="chips chips--inverse" aria-label="Technologies">${list(p.tech, (t) => `<li class="chip">${esc(t)}</li>`)}</ul>
        <div class="project__links">
          ${external(p.repo, `GitHub profile ${arrow('ne')}`, 'link-arrow')}
          ${p.demo ? external(p.demo, `Live demo ${arrow('ne')}`, 'link-arrow') : '<span class="project__na label">Live demo not published</span>'}
        </div>
      </div>
    </div>
  </div>
</article>`;

// Links for a "More work" card. Works for static content and Firestore documents (same field names).
// Relative paths such as demos/app.html stay on this site; both kinds open in a new tab.
const cardLinks = (p) => `
  ${p.liveUrl ? external(p.liveUrl, `${p.liveUrl.startsWith('demos/') ? 'Open demo' : 'Live site'} ${arrow('ne')}`, 'link-arrow') : '<span class="project__na label">Live demo not published</span>'}
  ${p.githubUrl ? external(p.githubUrl, `GitHub ${arrow('ne')}`, 'link-arrow') : ''}`;

// `reveal` is false when cards are swapped in after load (the scroll-reveal pass already ran).
export const moreCard = (p, reveal = true) => `
<article class="more-card"${reveal ? ' data-reveal' : ''} data-category="${esc(p.category || '')}">
  ${p.imageUrl ? `<${p.liveUrl ? 'a' : 'div'} class="more-card__shot"${p.liveUrl ? ` href="${esc(p.liveUrl)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"` : ''}><img src="${esc(p.imageUrl)}" alt="" width="960" height="600" loading="lazy" decoding="async"></${p.liveUrl ? 'a' : 'div'}>` : ''}
  <div class="more-card__body">
    <p class="label more-card__meta"><span>${esc(p.kind || p.category || '')}</span><span>${esc(p.status || '')}</span></p>
    <h3 class="more-card__title">${esc(p.title)}</h3>
    <p class="more-card__summary">${esc(p.summary)}</p>
    <ul class="chips chips--inverse" aria-label="Technologies">${list(p.techStack || [], (t) => `<li class="chip">${esc(t)}</li>`)}</ul>
    <div class="project__links">${cardLinks(p)}</div>
  </div>
</article>`;

export const moreProjectsInner = (items, reveal = true) => {
  const cats = [...new Set(items.map((p) => p.category).filter(Boolean))];
  return `
  <div class="more-projects__head">
    <div>
      <h3 class="more-projects__title">More work</h3>
      <p class="more-projects__lead">Browser apps and a full-stack project. Demos open in a new tab and keep their data in your browser.</p>
    </div>
    ${cats.length > 1 ? `<div class="more-projects__filters" role="group" aria-label="Filter by category">
      <button type="button" class="filter is-active" data-filter="" aria-pressed="true">All</button>
      ${list(cats, (c) => `<button type="button" class="filter" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`)}
    </div>` : ''}
  </div>
  <div class="more-projects__grid">${list(items, (p) => moreCard(p, reveal))}</div>`;
};

export const projectsSection = () => `
<section class="section projects inverse" id="projects" aria-labelledby="projects-title">
  <div class="container">
    ${heading({ index: '03', label: 'Selected projects', id: 'projects-title', lines: ['Learning', '<em>through</em> building.'] })}
    <p class="projects__intro" data-reveal>Coursework and project concepts that explore programming, algorithms, and software structure. Two of them can be tried right here.</p>
    ${projectIndex()}
  </div>
  ${list(projects, project)}
  <div class="container more-projects" data-more-projects>${moreProjectsInner([...webProjects].sort((a, b) => a.displayOrder - b.displayOrder))}</div>
</section>`;
