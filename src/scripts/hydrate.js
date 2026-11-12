// Replaces the build-time content with live data from Firestore, when there is any.
// The page is complete without this (it is rendered from content.js), so every failure is silent:
// no Firebase, no documents, or no network just means the visitor sees the built-in content.
import { listProjects, listSkills, listExperiences } from '../firebase/api.js';
import { firebaseReady } from '../firebase/app.js';
import { projects as builtIn, now as builtInNow, availability as builtInAvailability } from '../data/content.js';
import { skillRows } from '../render/sections/about.js';
import { moreProjectsInner } from '../render/sections/projects.js';
import { timelineRows, recognitionItems } from '../render/sections/closing.js';
import { nowHtml } from '../render/sections/now.js';
import { availabilityHtml } from '../render/sections/availability.js';
import { AVAILABILITY_DOC_ID, resolveAvailability } from '../shared/availability.js';
import { NOW_DOC_ID, resolveNow } from '../shared/now.js';

const $ = (selector, root = document) => root.querySelector(selector);

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
    // The three case studies are written in src/data/content.js and are not overwritten from the database.
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

  // The "Now" section: the owner's newest version from the dashboard, without waiting for a new deploy.
  if (experiences.status === 'fulfilled') {
    const saved = experiences.value.find((e) => e.id === NOW_DOC_ID);
    const slot = $('[data-now]');
    if (slot && saved) slot.innerHTML = nowHtml(resolveNow(saved, builtInNow), false);
    // The availability badge in the hero.
    const badge = $('[data-availability]');
    const availability = experiences.value.find((e) => e.id === AVAILABILITY_DOC_ID);
    if (badge && availability) badge.outerHTML = availabilityHtml(resolveAvailability(availability, builtInAvailability));
  }

  // Content height changed: let ScrollTrigger recompute its trigger positions.
  window.dispatchEvent(new Event('resize'));
}
