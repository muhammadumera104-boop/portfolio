// Blog listing: search, tag filter and pagination over the published posts in Firestore.
import { mountShell, setMeta } from './shell.js';
import { listPublishedPosts } from '../firebase/api.js';
import { firebaseReady } from '../firebase/app.js';
import { builtInPosts } from '../data/posts.js';
import { filterPosts, paginate, formatDate, readingTime, newestFirst } from '../shared/utils.js';
import { esc, list } from '../render/util.js';

const PER_PAGE = 6;
const main = mountShell({ current: 'blog.html' });
setMeta({
  title: 'Blog — Muhammad Umer Rizwan',
  description: 'Notes on programming, algorithms and learning to build for the web.',
});

main.innerHTML = `
<section class="page-head container">
  <p class="label"><span class="section-head__index">(Blog)</span> Writing</p>
  <h1 class="page-head__title">Notes from <em>learning</em> in public.</h1>
  <p class="page-head__lead">Short write-ups on programming, algorithms and building for the web.</p>
</section>
<section class="container blog">
  <div class="blog-tools">
    <label class="sr-only" for="blog-search">Search posts</label>
    <input id="blog-search" class="blog-search" type="search" placeholder="Search posts…" autocomplete="off" maxlength="80">
    <div class="blog-tags" role="group" aria-label="Filter by tag" data-tags></div>
  </div>
  <div class="post-grid" data-grid aria-live="polite"></div>
  <nav class="pager" aria-label="Pagination" data-pager></nav>
</section>`;

const grid = main.querySelector('[data-grid]');
const pager = main.querySelector('[data-pager]');
const tagBox = main.querySelector('[data-tags]');
const search = main.querySelector('#blog-search');

const params = new URLSearchParams(location.search);
const state = { q: params.get('q') || '', tag: params.get('tag') || '', page: Number(params.get('page')) || 1, posts: [] };
search.value = state.q;

const skeleton = () => list([1, 2, 3], () => '<div class="post-card post-card--skeleton skeleton" aria-hidden="true"></div>');
const message = (title, text) => `<div class="empty"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;

const card = (p) => `
<a class="post-card" href="post.html?slug=${encodeURIComponent(p.slug)}">
  ${p.coverImage ? `<img class="post-card__img" src="${esc(p.coverImage)}" alt="" loading="lazy" decoding="async">` : '<div class="post-card__img post-card__img--none" aria-hidden="true"></div>'}
  <div class="post-card__body">
    <p class="label post-card__meta">${esc(formatDate(p.createdAt))} · ${p.readingTime || readingTime(p.content)} min read</p>
    <h2 class="post-card__title">${esc(p.title)}</h2>
    <p class="post-card__excerpt">${esc(p.excerpt || '')}</p>
    <ul class="chips">${list(p.tags || [], (t) => `<li class="chip">${esc(t)}</li>`)}</ul>
  </div>
</a>`;

function sync() {
  const next = new URLSearchParams();
  if (state.q) next.set('q', state.q);
  if (state.tag) next.set('tag', state.tag);
  if (state.page > 1) next.set('page', String(state.page));
  const query = next.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
}

function render() {
  const tags = [...new Set(state.posts.flatMap((p) => p.tags || []))].sort();
  tagBox.innerHTML = tags.length
    ? `<button type="button" class="filter${state.tag ? '' : ' is-active'}" data-tag="">All</button>${list(
        tags,
        (t) => `<button type="button" class="filter${state.tag === t ? ' is-active' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`,
      )}`
    : '';

  const filtered = filterPosts(state.posts, { search: state.q, tag: state.tag });
  const view = paginate(filtered, state.page, PER_PAGE);
  state.page = view.page;

  grid.innerHTML = view.items.length
    ? list(view.items, card)
    : message(
        state.posts.length ? 'No matching posts' : 'No posts yet',
        state.posts.length ? 'Try a different search or tag.' : 'Check back soon — the first posts are on their way.',
      );

  pager.innerHTML =
    view.pages > 1
      ? `<button type="button" class="filter" data-page="${view.page - 1}"${view.page === 1 ? ' disabled' : ''}>Previous</button>
         <span class="label">Page ${view.page} of ${view.pages}</span>
         <button type="button" class="filter" data-page="${view.page + 1}"${view.page === view.pages ? ' disabled' : ''}>Next</button>`
      : '';
  sync();
}

let timer;
search.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.q = search.value;
    state.page = 1;
    render();
  }, 200);
});
tagBox.addEventListener('click', (event) => {
  const button = event.target.closest('[data-tag]');
  if (!button) return;
  state.tag = button.dataset.tag;
  state.page = 1;
  render();
});
pager.addEventListener('click', (event) => {
  const button = event.target.closest('[data-page]');
  if (!button || button.disabled) return;
  state.page = Number(button.dataset.page);
  render();
  main.querySelector('.blog').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Live posts from Firestore win. If there are none, or the database cannot be reached, the posts
// bundled with the site (src/data/posts.js) are shown so the blog is never empty.
(async () => {
  grid.innerHTML = skeleton();
  let live = [];
  if (firebaseReady) {
    try {
      live = await listPublishedPosts();
    } catch (error) {
      console.warn('[blog] using built-in posts:', error.message);
    }
  }
  state.posts = live.length ? live : [...builtInPosts].sort(newestFirst);
  render();
})();
