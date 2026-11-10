// Single post page: content, video guides, share buttons, related posts and comments.
// The build prerenders each post into /blog/<slug>/index.html for search engines. This script then
// loads the live version (views, comments, edits made since the last deploy) and attaches behaviour.
import { mountShell, setMeta, setJsonLd } from './shell.js';
import { cleanPostHtml } from '../shared/sanitize.js';
import { getPostBySlug, listPublishedPosts, countView, listComments, addComment } from '../firebase/api.js';
import { firebaseReady } from '../firebase/app.js';
import { commentSchema, fieldErrors } from '../shared/schemas.js';
import { builtInPosts, withBuiltInMedia } from '../data/posts.js';
import { formatDate, relatedPosts, makeExcerpt, toDate } from '../shared/utils.js';
import { postJsonLd, jsonLdText, absoluteUrl, postPath, socialImage, snippet } from '../shared/seo.js';
import { articleHtml } from '../render/blog.js';
import { toast } from '../shared/toast.js';
import { enhanceVideos } from './videos.js';
import { esc, list } from '../render/util.js';

const main = mountShell();

/** /blog/<slug>/ (clean URL) or the older post.html?slug=<slug>. */
const slug = decodeURIComponent(location.pathname.match(/^\/blog\/([^/]+)\/?$/)?.[1] || new URLSearchParams(location.search).get('slug') || '');

const notice = (title, text) => {
  main.innerHTML = `<section class="container page-head"><h1 class="page-head__title">${esc(title)}</h1>
    <p class="page-head__lead">${esc(text)}</p><p><a class="link-arrow" href="/blog/">Back to the blog</a></p></section>`;
};

const commentHtml = (c) => `
<li class="comment">
  <p class="comment__who"><strong>${esc(c.name)}</strong> <span class="label">${esc(formatDate(c.createdAt) || 'just now')}</span></p>
  <p class="comment__text">${esc(c.content)}</p>
</li>`;

const commentsSection = (comments, live) =>
  !live
    ? `<section class="container comments" aria-labelledby="comments-title">
    <h2 id="comments-title" class="related__title">Comments</h2>
    <p class="comments__empty">Comments open once this post is published from the admin dashboard.</p>
  </section>`
    : `<section class="container comments" aria-labelledby="comments-title">
    <h2 id="comments-title" class="related__title">Comments <span class="label" data-count>${comments.length}</span></h2>
    <ul class="comments__list" data-comments>${comments.length ? list(comments, commentHtml) : ''}</ul>
    <p class="comments__empty" data-empty${comments.length ? ' hidden' : ''}>No comments yet. Be the first.</p>
    <form class="comment-form" data-comment-form novalidate>
      <h3 class="contact-form__title">Leave a comment</h3>
      <div class="field"><label for="cm-name">Name</label><input id="cm-name" name="name" maxlength="80" autocomplete="name" required><p class="field__error" id="cm-name-err"></p></div>
      <div class="field"><label for="cm-content">Comment</label><textarea id="cm-content" name="content" rows="4" maxlength="1000" required></textarea><p class="field__error" id="cm-content-err"></p></div>
      <div class="field field--trap" aria-hidden="true"><label for="cm-web">Leave this empty</label><input id="cm-web" name="website" tabindex="-1" autocomplete="off"></div>
      <button class="btn btn--ink" type="submit">Post comment</button>
      <p class="contact-form__status" data-status role="status" aria-live="polite"></p>
    </form>
  </section>`;

function renderPost(post, related, comments, live) {
  const origin = location.origin;
  const url = absoluteUrl(origin, postPath(post.slug));
  const description = post.excerpt || makeExcerpt(post.content);
  setMeta({
    title: `${post.title} — Muhammad Umer Rizwan`,
    description: snippet(description),
    image: post.coverImage ? socialImage(origin, post.coverImage) : undefined,
    url,
    type: 'article',
  });
  setJsonLd(jsonLdText(postJsonLd({ siteUrl: origin, post, description: snippet(description), published: toDate(post.createdAt), modified: toDate(post.updatedAt) })));

  // Post HTML is written by the site owner in the admin editor, but it is sanitised anyway
  // (src/shared/sanitize.js): ordinary formatting plus YouTube embeds, nothing else.
  main.innerHTML = articleHtml(post, { url, bodyHtml: cleanPostHtml(post.content), related, views: live ? post.views || 0 : null }) + commentsSection(comments, live);
  enhanceVideos(main);

  main.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied.', 'success');
    } catch {
      toast('Could not copy — copy the address from your browser instead.', 'error');
    }
  });

  const form = main.querySelector('[data-comment-form]');
  if (!form) return; // built-in post: comments need the database
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // honeypot
    const result = commentSchema.safeParse(data);
    const errors = result.success ? {} : fieldErrors(result.error);
    ['name', 'content'].forEach((key) => {
      const field = form.elements[key];
      document.getElementById(`${field.id}-err`).textContent = errors[key] || '';
      field.setAttribute('aria-invalid', String(Boolean(errors[key])));
    });
    if (!result.success) {
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    button.disabled = true;
    try {
      await addComment(post.id, result.data);
      main.querySelector('[data-comments]').insertAdjacentHTML('beforeend', commentHtml(result.data));
      main.querySelector('[data-empty]').hidden = true;
      const count = main.querySelector('[data-count]');
      count.textContent = String(Number(count.textContent) + 1);
      form.reset();
      status.textContent = 'Thanks — your comment is up.';
      toast('Comment posted.', 'success');
    } catch (error) {
      console.error('[comment]', error);
      status.textContent = 'Could not post your comment. Please try again later.';
      toast('Could not post your comment.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  if (!live) return;
  countView(post.id).then((counted) => {
    if (counted) main.querySelector('[data-views]').textContent = String((post.views || 0) + 1);
  });
}

(async () => {
  if (!slug) return notice('No post selected', 'Open a post from the blog list.');
  const prerendered = main.querySelector('article.article');
  if (!prerendered) {
    main.innerHTML = '<div class="container article"><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>';
  }

  // Live post from Firestore first; otherwise the post bundled with the site (no comments or view counter).
  let live = null;
  let databaseDown = !firebaseReady;
  if (firebaseReady) {
    try {
      live = await getPostBySlug(slug);
    } catch (error) {
      databaseDown = true;
      console.warn('[post] database unavailable, trying built-in posts:', error.message);
    }
  }

  if (live) {
    const [all, comments] = await Promise.all([
      listPublishedPosts().catch(() => []),
      listComments(live.id).catch(() => []),
    ]);
    const post = withBuiltInMedia(live);
    return renderPost(post, relatedPosts(post, all.map(withBuiltInMedia)), comments, true);
  }

  const bundled = builtInPosts.find((p) => p.slug === slug);
  if (!bundled) {
    // Keep the prerendered copy only when the database could not be asked; if it answered "no such post",
    // the post was unpublished or deleted since the last deploy.
    if (prerendered && databaseDown) return enhanceVideos(main);
    return notice('Post not found', 'It may have been unpublished or moved.');
  }
  const post = { ...bundled, id: `built-in:${bundled.slug}`, views: 0 };
  renderPost(post, relatedPosts(post, builtInPosts.map((p) => ({ ...p, id: `built-in:${p.slug}` }))), [], false);
})();
