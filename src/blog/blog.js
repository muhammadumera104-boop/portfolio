// Blog listing: search, tag filter and pagination over the published posts in Firestore.
// The build prerenders every post card into blog/index.html, so the list is crawlable; this script
// then takes over for live data, search and paging.
import { mountShell, setMeta, setJsonLd } from './shell.js';
import { listPublishedPosts } from '../firebase/api.js';
import { firebaseReady } from '../firebase/app.js';
import { builtInPosts, withBuiltInDefaults } from '../data/posts.js';
import { filterPosts, paginate, newestFirst } from '../shared/utils.js';
import { blogJsonLd, jsonLdText, absoluteUrl } from '../shared/seo.js';
import { blogPageHtml, postCard } from '../render/blog.js';
import { esc, list } from '../render/util.js';

const PER_PAGE = 6;
const main = mountShell();
const prerendered = Boolean(main.querySelector('[data-grid][data-prerendered]'));
if (!prerendered) main.innerHTML = blogPageHtml([]);

setMeta({
  title: 'Blog — Muhammad Umer Rizwan',
  description: 'Notes on programming, algorithms and learning to build for the web, with thumbnails and video guides.',
  url: absoluteUrl(location.origin, '/blog/'),
  type: 'website',
});

const grid = main.querySelector('[data-grid]');
const pager = main.querySelector('[data-pager]');
const tagBox = main.querySelector('[data-tags]');
const search = main.querySelector('#blog-search');

const params = new URLSearchParams(location.search);
const state = { q: params.get('q') || '', tag: params.get('tag') || '', category: params.get('category') || '', page: Number(params.get('page')) || 1, posts: [] };
search.value = state.q;

const skeleton = () => list([1, 2, 3], () => '<div class="post-card post-card--skeleton skeleton" aria-hidden="true"></div>');
const message = (title, text) => `<div class="empty"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;

function sync() {
  const next = new URLSearchParams();
  if (state.q) next.set('q', state.q);
  if (state.tag) next.set('tag', state.tag);
  if (state.category) next.set('category', state.category);
  if (state.page > 1) next.set('page', String(state.page));
  const query = next.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
}

function render() {
  // Categories are the main filter; posts without any fall back to filtering by tag.
  const categories = [...new Set(state.posts.map((p) => p.category).filter(Boolean))].sort();
  const tags = [...new Set(state.posts.flatMap((p) => p.tags || []))].sort();
  const [kind, values, current] = categories.length ? ['category', categories, state.category] : ['tag', tags, state.tag];
  tagBox.setAttribute('aria-label', kind === 'category' ? 'Filter by category' : 'Filter by tag');
  tagBox.innerHTML = values.length
    ? `<button type="button" class="filter${current ? '' : ' is-active'}" data-filter-kind="${kind}" data-value="" aria-pressed="${!current}">All</button>${list(
        values,
        (v) => `<button type="button" class="filter${current === v ? ' is-active' : ''}" data-filter-kind="${kind}" data-value="${esc(v)}" aria-pressed="${current === v}">${esc(v)}</button>`,
      )}`
    : '';

  const filtered = filterPosts(state.posts, { search: state.q, tag: state.tag, category: state.category });
  const view = paginate(filtered, state.page, PER_PAGE);
  state.page = view.page;

  grid.innerHTML = view.items.length
    ? list(view.items, (p, i) => postCard(p, { eager: i === 0 }))
    : message(
        state.posts.length ? 'No matching posts' : 'No posts yet',
        state.posts.length ? 'Try a different search or tag.' : 'Check back soon — the first posts are on their way.',
      );
  grid.removeAttribute('data-prerendered');

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
  const button = event.target.closest('[data-filter-kind]');
  if (!button) return;
  if (button.dataset.filterKind === 'category') state.category = button.dataset.value;
  else state.tag = button.dataset.value;
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
  if (!prerendered) grid.innerHTML = skeleton();
  let live = [];
  if (firebaseReady) {
    try {
      live = await listPublishedPosts();
    } catch (error) {
      console.warn('[blog] using built-in posts:', error.message);
    }
  }
  state.posts = live.length ? live.map(withBuiltInDefaults) : [...builtInPosts].sort(newestFirst);
  render();
  setJsonLd(jsonLdText(blogJsonLd(location.origin, state.posts)));
})();
