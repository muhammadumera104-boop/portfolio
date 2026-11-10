// Markup for the blog list and post pages. Used twice: at build time (prerendered, crawlable HTML)
// and in the browser (live posts from Firestore), so both produce the same page.
import { esc, list } from './util.js';
import { formatDate, readingTime } from '../shared/utils.js';
import { optimizeImage, imageSrcset } from '../shared/cloudinary.js';
import { normalizeVideos } from '../shared/media.js';
import { postPath, rootPath } from '../shared/seo.js';

/** Picks the thumbnail of a post: its cover image, else the first video that has a thumbnail, else nothing. */
export function thumbnailOf(post) {
  if (post.coverImage) return { src: rootPath(post.coverImage), kind: 'cover' };
  const video = normalizeVideos(post.videos).find((v) => v.thumb);
  return video ? { src: video.thumb, kind: 'video' } : null;
}

const CARD_WIDTHS = [400, 640, 960];

export const postCard = (post, { eager = false } = {}) => {
  const thumb = thumbnailOf(post);
  const videos = normalizeVideos(post.videos);
  const img = thumb
    ? (() => {
        const srcset = thumb.kind === 'cover' ? imageSrcset(thumb.src, CARD_WIDTHS, 16 / 9) : '';
        const src = thumb.kind === 'cover' ? optimizeImage(thumb.src, { width: 640, height: 360 }) : thumb.src;
        return `<img class="post-card__img" src="${esc(src)}"${srcset ? ` srcset="${esc(srcset)}" sizes="(min-width: 720px) 22rem, 100vw"` : ''} width="640" height="360" alt="" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
      })()
    : '<div class="post-card__img post-card__img--none" aria-hidden="true"></div>';
  return `
<a class="post-card" href="${esc(postPath(post.slug))}">
  <div class="post-card__media">${img}${videos.length ? `<span class="post-card__badge"><span aria-hidden="true">▶</span> ${videos.length === 1 ? 'Video guide' : `${videos.length} video guides`}</span>` : ''}</div>
  <div class="post-card__body">
    <p class="label post-card__meta">${esc(formatDate(post.createdAt))} · ${post.readingTime || readingTime(post.content)} min read</p>
    <h2 class="post-card__title">${esc(post.title)}</h2>
    <p class="post-card__excerpt">${esc(post.excerpt || '')}</p>
    <ul class="chips">${list(post.tags || [], (t) => `<li class="chip">${esc(t)}</li>`)}</ul>
  </div>
</a>`;
};

/** The blog list page body. `posts` is every published post, newest first. */
export const blogPageHtml = (posts) => `
<section class="page-head container">
  <p class="label"><span class="section-head__index">(Blog)</span> Writing</p>
  <h1 class="page-head__title">Notes from <em>learning</em> in public.</h1>
  <p class="page-head__lead">Short write-ups on programming, algorithms and building for the web, each with a thumbnail and video guides to go deeper.</p>
</section>
<section class="container blog">
  <div class="blog-tools">
    <label class="sr-only" for="blog-search">Search posts</label>
    <input id="blog-search" class="blog-search" type="search" placeholder="Search posts…" autocomplete="off" maxlength="80">
    <div class="blog-tags" role="group" aria-label="Filter by tag" data-tags></div>
  </div>
  <div class="post-grid" data-grid aria-live="polite" data-prerendered>${list(posts, (p, i) => postCard(p, { eager: i === 0 }))}</div>
  <nav class="pager" aria-label="Pagination" data-pager></nav>
</section>`;

/** "Watch & learn": thumbnail cards that link to YouTube and play inline (privacy-friendly) when JS is on. */
export function videoGuidesHtml(videos) {
  const items = normalizeVideos(videos);
  if (!items.length) return '';
  return `
<section class="container videos" aria-labelledby="videos-title">
  <h2 id="videos-title" class="related__title">Watch &amp; learn</h2>
  <p class="videos__lead">Video guides that explain the same ideas. They open in a new tab, or play right here when you click the thumbnail.</p>
  <ul class="videos__list">${list(items, (v) => `
    <li>
      <a class="video-card" href="${esc(v.href)}" target="_blank" rel="noopener noreferrer" data-video-title="${esc(v.title || 'Video guide')}"${v.embed ? ` data-video-embed="${esc(v.embed)}"` : ''}${v.src ? ` data-video-src="${esc(v.src)}"` : ''}>
        <span class="video-card__thumb">
          ${v.thumb ? `<img src="${esc(v.thumb)}" width="480" height="360" alt="" loading="lazy" decoding="async">` : ''}
          <span class="video-card__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" focusable="false"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>
        </span>
        <span class="video-card__title">${esc(v.title || 'Video guide')}</span>
        <span class="label">Watch on ${esc(v.label)}<span class="sr-only"> (opens in a new tab)</span></span>
      </a>
    </li>`)}</ul>
</section>`;
}

export const shareHtml = (url, title) => {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return `
  <div class="share" aria-label="Share this post">
    <span class="label">Share</span>
    <button type="button" class="filter" data-copy>Copy link</button>
    <a class="filter" href="https://twitter.com/intent/tweet?url=${u}&amp;text=${t}" target="_blank" rel="noopener noreferrer">X</a>
    <a class="filter" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    <a class="filter" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
  </div>`;
};

export const relatedHtml = (related) =>
  related.length
    ? `<section class="container related" aria-labelledby="related-title">
    <h2 id="related-title" class="related__title">Related posts</h2>
    <ul class="related__list">${list(related, (p) => `<li><a href="${esc(postPath(p.slug))}">${esc(p.title)}</a><span class="label">${esc(formatDate(p.createdAt))}</span></li>`)}</ul>
  </section>`
    : '';

/**
 * The post itself. `bodyHtml` must already be sanitised. Comments are added by the browser only,
 * because they live in the database.
 */
export function articleHtml(post, { url, bodyHtml, related = [], views = null }) {
  const minutes = post.readingTime || readingTime(post.content);
  const cover = post.coverImage ? rootPath(post.coverImage) : '';
  return `
  <article class="container article">
    <p class="label"><a href="/blog/">← All posts</a></p>
    <ul class="chips article__tags">${list(post.tags || [], (t) => `<li class="chip">${esc(t)}</li>`)}</ul>
    <h1 class="article__title">${esc(post.title)}</h1>
    <p class="label article__meta">${esc(post.authorName || 'Muhammad Umer Rizwan')} · ${esc(formatDate(post.createdAt))} · ${minutes} min read${views === null ? '' : ` · <span data-views>${views}</span> views`}</p>
    ${cover ? `<img class="article__cover" src="${esc(optimizeImage(cover, { width: 1200, height: 630 }))}" width="1200" height="630" alt="${esc(`Thumbnail for ${post.title}`)}" fetchpriority="high" decoding="async">` : ''}
    <div class="prose" data-prose>${bodyHtml}</div>
    ${shareHtml(url, post.title)}
  </article>
  ${videoGuidesHtml(post.videos)}
  ${relatedHtml(related)}`;
}
