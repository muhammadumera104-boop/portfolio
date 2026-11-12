// The CV as a small standalone HTML page, built from src/data/content.js only (nothing is typed twice or invented).
// `npm run cv` prints it to public/cv/Muhammad-Umer-Rizwan-CV.pdf, the fixed file behind the "Download CV (PDF)" button.
import { cv, profile, links, about, education, skills, projects, webProjects, featuredRepos, certificates, achievements, recognition } from '../data/content.js';
import { cleanCertificates, cleanAchievements, formatDate } from '../shared/credentials.js';
import { esc, list } from './util.js';

export const CV_FILE = cv.file;
export const CV_PATH = cv.path;

const bare = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const CASE_STUDY_BASE = 'https://github.com/muhammadumera104-boop/portfolio/tree/main/case-studies';

/** The projects shown on the CV: the three case studies, then the biggest builds, then a one-line list of the rest. */
export function cvProjects() {
  const lms = webProjects.find((p) => p.slug === 'gu-tech-lms');
  const mindbridge = featuredRepos.find((r) => r.name === 'digital-well-being');
  const main = [
    ...projects.map((p) => ({ title: p.title, meta: p.kind, text: p.summary, url: p.repo || `${CASE_STUDY_BASE}/${p.id}` })),
    lms && { title: lms.title, meta: lms.kind, text: lms.summary, url: lms.githubUrl },
    mindbridge && { title: mindbridge.title, meta: mindbridge.language, text: mindbridge.text, url: mindbridge.url },
  ].filter(Boolean);
  const also = webProjects.filter((p) => p.slug !== 'gu-tech-lms').map((p) => p.title.split(' — ')[0]);
  return { main, also };
}

export function cvHtml(siteUrl = '') {
  const { main, also } = cvProjects();
  const certs = cleanCertificates(certificates);
  const wins = cleanAchievements(achievements);
  const looking = about.facts.find((f) => f.label === 'Looking for')?.value;
  const contact = [profile.location, profile.email, ...links.map((l) => bare(l.href)), siteUrl && bare(siteUrl)].filter(Boolean);

  const section = (title, body) => (body ? `<section><h2>${esc(title)}</h2>${body}</section>` : '');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(profile.name)} — CV</title>
<style>
  @page { size: A4; margin: 13mm 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #1a1a1a; font: 9.6pt/1.42 Calibri, 'Segoe UI', Arial, sans-serif; }
  a { color: inherit; text-decoration: none; }
  h1 { margin: 0; font-size: 21pt; line-height: 1.1; letter-spacing: -0.01em; }
  .aka { margin: 2px 0 0; color: #555; }
  .role { margin: 4px 0 0; font-size: 11pt; font-weight: 600; color: #c2341f; }
  .contact { margin: 6px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0 14px; color: #333; font-size: 9pt; }
  header { padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; }
  section { margin-top: 11px; break-inside: avoid-page; }
  h2 { margin: 0 0 4px; font-size: 9pt; letter-spacing: 0.12em; text-transform: uppercase; color: #c2341f; }
  p { margin: 0; }
  .row { display: flex; justify-content: space-between; gap: 12px; }
  .row b { font-weight: 650; }
  .muted { color: #555; }
  .item { margin-top: 5px; break-inside: avoid; }
  .item:first-of-type { margin-top: 0; }
  .link { color: #444; font-size: 8.6pt; word-break: break-all; }
  ul.skills { margin: 0; padding: 0; list-style: none; }
  ul.skills li { margin: 1px 0; }
  ul.skills b { display: inline-block; min-width: 128px; }
</style>
</head>
<body>
<header>
  <h1>${esc(profile.name)}</h1>
  ${profile.alsoKnownAs ? `<p class="aka">Also known as ${esc(profile.alsoKnownAs)}</p>` : ''}
  <p class="role">${esc(profile.role)}${looking ? ` · seeking ${esc(looking.charAt(0).toLowerCase() + looking.slice(1))}` : ''}</p>
  <ul class="contact">${list(contact, (c) => `<li>${esc(c)}</li>`)}</ul>
</header>
${section('Profile', `<p>${esc(about.lead)} ${esc(about.paragraphs[1] || '')}</p>`)}
${section(
  'Education',
  list(education, (e) => `<div class="item"><div class="row"><b>${esc(e.title)}, ${esc(e.place)}</b><span class="muted">${esc(e.period)}${e.note ? ` (${esc(e.note.toLowerCase())})` : ''}</span></div><p class="muted">${esc(e.text)}</p></div>`),
)}
${section('Skills', `<ul class="skills">${list(skills, (s) => `<li><b>${esc(s.group)}</b>${esc(s.items.join(', '))}${s.level === 'learning' ? ' (learning)' : ''}</li>`)}</ul>`)}
${section(
  'Projects',
  `${list(main, (p) => `<div class="item"><div class="row"><b>${esc(p.title)}</b><span class="muted">${esc(p.meta || '')}</span></div><p>${esc(p.text)}</p>${p.url ? `<p class="link">${esc(bare(p.url))}</p>` : ''}</div>`)}
   ${also.length ? `<p class="item muted">Also built (small browser apps with live demos on the portfolio): ${esc(also.join(', '))}.</p>` : ''}`,
)}
${section('Certificates', list(certs, (c) => `<div class="item row"><span><b>${esc(c.title)}</b>, ${esc(c.issuer)}</span><span class="muted">${esc(formatDate(c.date))}</span></div>`))}
${section('Achievements', list(wins, (a) => `<div class="item"><div class="row"><b>${esc(a.title)}</b><span class="muted">${esc(formatDate(a.date))}</span></div><p>${esc(a.detail)}</p></div>`))}
${section('Recognition and languages', list(recognition, (r) => `<div class="item"><p><b>${esc(r.title)}</b> · ${esc(r.place)}. ${esc(r.text)}</p></div>`))}
</body>
</html>`;
}
