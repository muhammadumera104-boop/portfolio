// Replaces the build-time content with live data from Firestore, when there is any.
// The page is complete without this (it is rendered from content.js), so every failure is silent:
// no Firebase, no documents, or no network just means the visitor sees the built-in content.
import { listProjects, listSkills, listExperiences } from '../firebase/api.js';
import { firebaseReady } from '../firebase/app.js';
import { projects as builtIn } from '../data/content.js';
import { skillRows } from '../render/sections/about.js';
import { moreProjectsInner } from '../render/sections/projects.js';
import { timelineRows, recognitionItems } from '../render/sections/closing.js';
import { esc, list, arrow, external } from '../render/util.js';
import { repoUrl } from '../shared/utils.js';

const $ = (selector, root = document) => root.querySelector(selector);

function links(p) {
  const repo = repoUrl(p.githubUrl) ? external(repoUrl(p.githubUrl), `GitHub ${arrow('ne')}`, 'link-arrow') : '';
  const demo = p.liveUrl
    ? external(p.liveUrl, `Live demo ${arrow('ne')}`, 'link-arrow')
    : '<span class="project__na label">Live demo not published</span>';
  return repo + demo;
}

const chips = (items = []) => list(items, (t) => `<li class="chip">${esc(t)}</li>`);

// One of the three built-in projects was edited in the admin: update its text in place.
// The illustrations and interactive sketches are part of the page design and stay as they are.
function patchBuiltIn(p) {
  const root = document.getElementById(`project-${p.slug}`);
  if (!root) return;
  const set = (selector, text) => {
    const el = $(selector, root);
    if (el && text) el.textContent = text;
  };
  set('.project__title', p.title);
  set('.project__summary', p.summary);
  const meta = root.querySelectorAll('.project__meta span');
  if (meta[0] && p.kind) meta[0].textContent = p.kind;
  if (meta[1] && p.status) meta[1].textContent = p.status;
  const blocks = root.querySelectorAll('.project__block');
  if (blocks[0] && p.problem) blocks[0].querySelector('p').textContent = p.problem;
  if (blocks[1] && p.details?.length) blocks[1].querySelector('ul').innerHTML = list(p.details, (d) => `<li>${esc(d)}</li>`);
  if (blocks[2]) {
    if (p.outcome) blocks[2].querySelector('p').textContent = p.outcome;
    if (p.techStack?.length) blocks[2].querySelector('.chips').innerHTML = chips(p.techStack);
    blocks[2].querySelector('.project__links').innerHTML = links(p);
  }
  const row = document.querySelector(`.project-index__row[data-preview="${CSS.escape(p.slug)}"]`);
  if (row) {
    const title = $('.project-index__title', row);
    const kind = $('.project-index__kind', row);
    if (title) title.textContent = p.title;
    if (kind && p.kind) kind.textContent = p.kind;
  }
}

// Everything that is not one of the three case-study articles goes into "More work".
// The filter buttons are handled by scripts/more-projects.js (one listener on the container).
function renderMore(extra) {
  const host = $('[data-more-projects]');
  if (!host || !extra.length) return;
  host.innerHTML = moreProjectsInner(extra, false);
}

export async function hydrate() {
  if (!firebaseReady) return;
  const [projects, skills, experiences] = await Promise.allSettled([listProjects(), listSkills(), listExperiences()]);

  if (projects.status === 'fulfilled' && projects.value.length) {
    const known = new Set(builtIn.map((b) => b.id));
    projects.value.filter((p) => known.has(p.slug)).forEach(patchBuiltIn);
    renderMore(projects.value.filter((p) => !known.has(p.slug)));
  }

  if (skills.status === 'fulfilled' && skills.value.length) {
    const el = $('[data-skills-list]');
    if (el) el.innerHTML = skillRows(skills.value, false);
  }

  if (experiences.status === 'fulfilled' && experiences.value.length) {
    const edu = experiences.value.filter((e) => e.kind === 'education');
    const rec = experiences.value.filter((e) => e.kind === 'recognition').map((e) => ({ ...e, label: e.note }));
    const timeline = $('[data-timeline]');
    if (timeline && edu.length) timeline.innerHTML = timelineRows(edu, false);
    const wrap = $('[data-recognition]');
    if (wrap && rec.length) {
      wrap.querySelectorAll('.recognition__item:not(.recognition__cv)').forEach((n) => n.remove());
      wrap.querySelector('.recognition__cv')?.insertAdjacentHTML('beforebegin', recognitionItems(rec, false));
    }
  }

  // Content height changed: let ScrollTrigger recompute its trigger positions.
  window.dispatchEvent(new Event('resize'));
}
