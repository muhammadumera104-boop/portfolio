// Project page (/projects/<slug>/). The build prerenders every known project into its own HTML file. This script
// attaches the behaviour (theme, menu, click-to-play video) and, for a project added after the last deploy,
// loads it from Firestore and renders the same markup.
import { mountShell, setMeta, setJsonLd } from './shell.js';
import { listProjects } from '../firebase/api.js';
import { firebaseReady } from '../firebase/app.js';
import { projects as builtIn, webProjects, withBuiltInProjectDefaults } from '../data/content.js';
import { projectPageHtml } from '../render/project.js';
import { projectJsonLd, jsonLdText, absoluteUrl, projectPath, socialImage, snippet } from '../shared/seo.js';
import { enhanceVideos } from './videos.js';
import { esc } from '../render/util.js';

const main = mountShell({ current: '' });
const slug = decodeURIComponent(location.pathname.match(/^\/projects\/([^/]+)\/?$/)?.[1] || '');

function notFound() {
  document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex">');
  document.title = 'Project not found — Muhammad Umer Rizwan';
  main.innerHTML = `<section class="container page-head"><h1 class="page-head__title">Project not found</h1>
    <p class="page-head__lead">It may have been renamed or removed.</p><p><a class="link-arrow" href="/#projects">See all projects</a></p></section>`;
}

function show(project, others) {
  const origin = location.origin;
  const description = snippet(project.summary);
  setMeta({
    title: `${project.title} — Muhammad Umer Rizwan`,
    description,
    image: project.imageUrl ? socialImage(origin, project.imageUrl) : undefined,
    url: absoluteUrl(origin, projectPath(project.slug)),
    type: 'article',
  });
  setJsonLd(jsonLdText(projectJsonLd({ siteUrl: origin, project, description })));
  main.innerHTML = projectPageHtml(project, { others });
  enhanceVideos(main);
}

(async () => {
  if (!slug) return notFound();
  if (main.querySelector('article.project-page')) return enhanceVideos(main); // prerendered by the build

  let live = [];
  if (firebaseReady) {
    try {
      live = await listProjects();
    } catch (error) {
      console.warn('[project] database unavailable, using built-in projects:', error.message);
    }
  }
  const known = new Set(builtIn.map((b) => b.id));
  const all = (live.length ? live.filter((p) => !known.has(p.slug)).map(withBuiltInProjectDefaults) : webProjects).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const project = all.find((p) => p.slug === slug);
  if (!project) return notFound();
  main.innerHTML = '';
  show(project, all.filter((p) => p.slug !== slug).slice(0, 4));
})().catch((error) => {
  console.error('[project]', error);
  main.innerHTML = `<section class="container page-head"><h1 class="page-head__title">Something went wrong</h1><p class="page-head__lead">${esc('Please reload the page.')}</p></section>`;
});
