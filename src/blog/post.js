// Single post page: content, share buttons, related posts and comments.
import DOMPurify from 'dompurify';
import { mountShell, setMeta } from './shell.js';
import { getPostBySlug, listPublishedPosts, countView, listComments, addComment } from '../firebase/api.js';
import { firebaseReady } from '../firebase/app.js';
import { commentSchema, fieldErrors } from '../shared/schemas.js';
import { formatDate, readingTime, relatedPosts, makeExcerpt } from '../shared/utils.js';
import { toast } from '../shared/toast.js';
import { esc, list } from '../render/util.js';

const main = mountShell({ current: 'blog.html' });
const slug = new URLSearchParams(location.search).get('slug') || '';

// Post HTML is written by the site owner in the admin editor, but it is sanitised anyway.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});
const clean = (html) => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

const notice = (title, text) => {
  main.innerHTML = `<section class="container page-head"><h1 class="page-head__title">${esc(title)}</h1>
    <p class="page-head__lead">${esc(text)}</p><p><a class="link-arrow" href="blog.html">Back to the blog</a></p></section>`;
};

const commentHtml = (c) => `
<li class="comment">
  <p class="comment__who"><strong>${esc(c.name)}</strong> <span class="label">${esc(formatDate(c.createdAt) || 'just now')}</span></p>
  <p class="comment__text">${esc(c.content)}</p>
</li>`;

function shareLinks(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return `
  <div class="share" aria-label="Share this post">
    <span class="label">Share</span>
    <button type="button" class="filter" data-copy>Copy link</button>
    <a class="filter" href="https://twitter.com/intent/tweet?url=${u}&text=${t}" target="_blank" rel="noopener noreferrer">X</a>
    <a class="filter" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    <a class="filter" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
  </div>`;
}

function renderPost(post, related, comments) {
  const url = location.href.split('#')[0];
  const minutes = post.readingTime || readingTime(post.content);
  const description = post.excerpt || makeExcerpt(post.content);
  setMeta({ title: `${post.title} — Muhammad Umer Rizwan`, description, image: post.coverImage });

  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    author: { '@type': 'Person', name: post.authorName || 'Muhammad Umer Rizwan' },
    datePublished: (post.createdAt?.toDate?.() || new Date()).toISOString(),
    ...(post.coverImage ? { image: post.coverImage } : {}),
  });
  document.head.append(ld);

  main.innerHTML = `
  <article class="container article">
    <p class="label"><a href="blog.html">← All posts</a></p>
    <ul class="chips article__tags">${list(post.tags || [], (t) => `<li class="chip">${esc(t)}</li>`)}</ul>
    <h1 class="article__title">${esc(post.title)}</h1>
    <p class="label article__meta">${esc(post.authorName || 'Muhammad Umer Rizwan')} · ${esc(formatDate(post.createdAt))} · ${minutes} min read · <span data-views>${post.views || 0}</span> views</p>
    ${post.coverImage ? `<img class="article__cover" src="${esc(post.coverImage)}" alt="" decoding="async">` : ''}
    <div class="prose" data-prose></div>
    ${shareLinks(url, post.title)}
  </article>

  ${related.length ? `<section class="container related" aria-labelledby="related-title">
    <h2 id="related-title" class="related__title">Related posts</h2>
    <ul class="related__list">${list(related, (p) => `<li><a href="post.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a><span class="label">${esc(formatDate(p.createdAt))}</span></li>`)}</ul>
  </section>` : ''}

  <section class="container comments" aria-labelledby="comments-title">
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

  main.querySelector('[data-prose]').innerHTML = clean(post.content);

  main.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied.', 'success');
    } catch {
      toast('Could not copy — copy the address from your browser instead.', 'error');
    }
  });

  const form = main.querySelector('[data-comment-form]');
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

  countView(post.id).then((counted) => {
    if (counted) main.querySelector('[data-views]').textContent = String((post.views || 0) + 1);
  });
}

(async () => {
  if (!slug) return notice('No post selected', 'Open a post from the blog list.');
  if (!firebaseReady) return notice('Blog unavailable', 'This site is not connected to a database yet.');
  main.innerHTML = '<div class="container article"><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>';
  try {
    const post = await getPostBySlug(slug);
    if (!post) return notice('Post not found', 'It may have been unpublished or moved.');
    const [all, comments] = await Promise.all([
      listPublishedPosts().catch(() => []),
      listComments(post.id).catch(() => []),
    ]);
    renderPost(post, relatedPosts(post, all), comments);
  } catch (error) {
    console.error('[post]', error);
    notice('Could not load this post', 'Please check your connection and try again in a moment.');
  }
})();
