// Markup for a project's own page (/projects/<slug>/). Used at build time (prerendered, crawlable HTML) and in the
// browser for projects added after the last deploy. Sections without content are left out, so a project never
// shows an empty heading or placeholder text.
import { esc, list, arrow, external } from './util.js';
import { videoGuidesHtml } from './blog.js';
import { optimizeImage } from '../shared/cloudinary.js';
import { normalizeVideos } from '../shared/media.js';
import { projectPath, rootPath } from '../shared/seo.js';

const SHOT_WIDTHS = { thumb: 800, full: 1600 };

const isLocalDemo = (href) => href && !/^https?:\/\//i.test(href);
const demoHref = (href) => (isLocalDemo(href) ? rootPath(href) : href);

const block = (id, title, body) => (body ? `<section class="project-page__block" aria-labelledby="${id}"><h2 id="${id}" class="project-page__h2">${title}</h2>${body}</section>` : '');

const screenshotsHtml = (shots) =>
  shots?.length
    ? `<ul class="shots">${list(shots, (s) => {
        const src = rootPath(s.url);
        return `<li><figure class="shots__item"><a href="${esc(optimizeImage(src, { width: SHOT_WIDTHS.full }))}" target="_blank" rel="noopener noreferrer"><img src="${esc(optimizeImage(src, { width: SHOT_WIDTHS.thumb }))}" alt="${esc(s.alt)}" width="800" height="500" loading="lazy" decoding="async"><span class="sr-only"> (open the full-size image in a new tab)</span></a><figcaption class="label">${esc(s.alt)}</figcaption></figure></li>`;
      })}</ul>`
    : '';

/** @param {object} p a project (static data or a Firestore document); @param {object[]} others projects to link to */
export function projectPageHtml(p, { others = [] } = {}) {
  const live = p.liveUrl ? demoHref(p.liveUrl) : '';
  const hero = p.imageUrl ? rootPath(p.imageUrl) : '';
  const demo = p.demoVideo ? videoGuidesHtml([{ url: p.demoVideo, title: `${p.title} — demo video` }], { title: 'Demo video', lead: 'A walkthrough of the project. It opens in a new tab, or plays here when you click the thumbnail.' }) : '';
  const hasVideo = normalizeVideos([{ url: p.demoVideo }]).length > 0;
  return `
<article class="container project-page" aria-labelledby="project-title">
  <nav class="breadcrumb label" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/#projects">Projects</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(p.title)}</span></nav>
  <header class="project-page__head">
    <p class="label project-page__meta"><span>${esc(p.kind || p.category || '')}</span>${p.status ? `<span>${esc(p.status)}</span>` : ''}</p>
    <h1 id="project-title" class="project-page__title">${esc(p.title)}</h1>
    <p class="project-page__summary">${esc(p.summary)}</p>
    <div class="project-page__links">
      ${live ? external(live, `${isLocalDemo(p.liveUrl) ? 'Open the demo' : 'Visit the live site'} ${arrow('ne')}`, 'btn btn--ink') : ''}
      ${p.githubUrl ? external(p.githubUrl, `View on GitHub ${arrow('ne')}`, 'btn btn--line') : ''}
      ${!live ? '<span class="project__na label">Live demo not published</span>' : ''}
    </div>
  </header>
  ${hero ? `<figure class="project-page__hero"><img src="${esc(optimizeImage(rootPath(hero), { width: 1400 }))}" width="1200" height="750" alt="${esc(`Preview of the ${p.title} project`)}" fetchpriority="high" decoding="async"></figure>` : ''}
  <div class="project-page__body">
    ${block('pp-problem', 'The problem', p.problem ? `<p>${esc(p.problem)}</p>` : '')}
    ${block('pp-features', 'Key features', p.features?.length ? `<ul class="project-page__list">${list(p.features, (f) => `<li>${esc(f)}</li>`)}</ul>` : '')}
    ${block('pp-process', 'Development process', p.process ? `<p>${esc(p.process).replace(/\n{2,}/g, '</p><p>')}</p>` : '')}
    ${block('pp-challenges', 'Challenges and solutions', p.challenges?.length ? `<dl class="challenges">${list(p.challenges, (c) => `<div class="challenges__item"><dt>${esc(c.challenge)}</dt><dd>${esc(c.solution)}</dd></div>`)}</dl>` : '')}
    ${block('pp-impl', 'How it is built', p.details?.length ? `<ul class="project-page__list">${list(p.details, (d) => `<li>${esc(d)}</li>`)}</ul>` : '')}
    ${block('pp-shots', 'Screenshots', screenshotsHtml(p.screenshots))}
    ${block('pp-outcome', 'Outcome', p.outcome ? `<p>${esc(p.outcome)}</p>` : '')}
    ${block('pp-tech', 'Technologies', p.techStack?.length ? `<ul class="chips chips--inverse" aria-label="Technologies">${list(p.techStack, (t) => `<li class="chip">${esc(t)}</li>`)}</ul>` : '')}
  </div>
</article>
${hasVideo ? demo : ''}
${others.length ? `<section class="container related" aria-labelledby="more-projects-title">
  <h2 id="more-projects-title" class="related__title">More projects</h2>
  <ul class="related__list">${list(others, (o) => `<li><a href="${esc(projectPath(o.slug))}">${esc(o.title)}</a><span class="label">${esc(o.kind || o.category || '')}</span></li>`)}</ul>
</section>` : ''}
<section class="container project-page__cta" aria-labelledby="pp-cta">
  <h2 id="pp-cta" class="related__title">Want to talk about this project?</h2>
  <p>I am happy to explain how it works or what I would do differently. <a class="link-arrow" href="/#contact">Get in touch ${arrow('ne')}</a> or <a class="link-arrow" href="/blog/">read the blog ${arrow('ne')}</a>.</p>
</section>`;
}
