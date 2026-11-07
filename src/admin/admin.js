// Admin dashboard. Plain DOM + event delegation; no framework.
// Authorisation is enforced by firestore.rules / storage.rules — the client checks only improve the UX.
import '@fontsource-variable/dm-sans/opsz.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/app.css';
import '../styles/admin.css';
import * as api from '../firebase/admin-api.js';
import { createEditor } from './editor.js';
import { toast } from '../shared/toast.js';
import {
  postSchema, projectSchema, skillSchema, experienceSchema, fieldErrors,
} from '../shared/schemas.js';
import { slugify, readingTime, makeExcerpt, formatDate, toDate, parseCsv, parseLines } from '../shared/utils.js';
import { esc, list } from '../render/util.js';

const root = document.getElementById('admin-root');
const state = { user: null, tab: 'overview', editor: null };

const TABS = [
  ['overview', 'Overview'], ['blog', 'Blog'], ['projects', 'Projects'], ['skills', 'Skills'],
  ['experiences', 'Education'], ['messages', 'Messages'], ['comments', 'Comments'],
];

// ── helpers ─────────────────────────────────────────────────
const explain = (error) => {
  const code = error?.code || '';
  if (code.includes('permission-denied')) return 'Permission denied. Deploy firestore.rules and sign in with the admin account.';
  if (code.includes('unauthenticated')) return 'Please sign in again.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Wrong email or password.';
  if (code.includes('popup-closed')) return 'Sign-in was cancelled.';
  if (code.includes('unauthorized-domain')) return 'This domain is not authorised in Firebase Auth settings.';
  if (code.includes('operation-not-allowed')) return 'This sign-in method is not enabled in the Firebase console.';
  if (code.includes('storage/unauthorized')) return 'Upload blocked. Check storage.rules and that Storage is enabled.';
  return error?.message || 'Something went wrong.';
};

/** Runs an async action with a spinner-less guard, a success toast and an error toast. */
async function act(fn, success) {
  try {
    const result = await fn();
    if (success) toast(success, 'success');
    return result;
  } catch (error) {
    console.error(error);
    toast(explain(error), 'error', 7000);
    return undefined;
  }
}

const showErrors = (form, errors) => {
  form.querySelectorAll('[data-err]').forEach((el) => (el.textContent = errors[el.dataset.err] || ''));
  form.querySelectorAll('[name]').forEach((el) => el.setAttribute('aria-invalid', String(Boolean(errors[el.name]))));
};

const when = (value) => formatDate(value) || '—';

// ── login ───────────────────────────────────────────────────
function viewLogin(message = '') {
  root.innerHTML = `
  <main class="login">
    <form class="login__card" data-login novalidate>
      <p class="label">Private area</p>
      <h1 class="login__title">Admin sign in</h1>
      ${message ? `<p class="login__msg" role="alert">${message}</p>` : ''}
      <div class="field"><label for="l-email">Email</label><input id="l-email" name="email" type="email" autocomplete="username" required></div>
      <div class="field"><label for="l-pass">Password</label><input id="l-pass" name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn btn--ink" type="submit">Sign in</button>
      <button class="btn btn--line" type="button" data-google>Continue with Google</button>
      <p class="login__hint">Only the site owner can use this area. <a href="index.html">Back to site</a></p>
    </form>
  </main>`;
}

function viewDenied(user) {
  const wrongAccount = !user.email || user.email.toLowerCase() !== api.adminEmail;
  root.innerHTML = `
  <main class="login"><div class="login__card">
    <p class="label">Not authorised</p>
    <h1 class="login__title">${wrongAccount ? 'This account is not the site owner' : 'Verify your email first'}</h1>
    <p>${wrongAccount
      ? `You are signed in as <strong>${esc(user.email || 'unknown')}</strong>. Sign in with the owner account instead.`
      : 'The security rules only trust verified email addresses. Verify this one, or sign in with Google (which is verified automatically).'}</p>
    ${wrongAccount ? '' : '<button class="btn btn--ink" type="button" data-verify>Send verification email</button>'}
    <button class="btn btn--line" type="button" data-logout>Sign out</button>
  </div></main>`;
}

// ── shell ───────────────────────────────────────────────────
function viewShell() {
  root.innerHTML = `
  <div class="admin">
    <aside class="admin__side">
      <a class="logo" href="index.html">M<span class="logo__dot">.</span>Umer</a>
      <nav aria-label="Admin">${TABS.map(([key, label]) => `<button type="button" class="admin__tab" data-tab="${key}">${label}</button>`).join('')}</nav>
      <div class="admin__foot">
        <p class="label">${esc(state.user.email)}</p>
        <a class="link-arrow" href="index.html">View site</a>
        <button type="button" class="btn btn--line btn--sm" data-logout>Sign out</button>
      </div>
    </aside>
    <main class="admin__main" id="admin-main" tabindex="-1"></main>
  </div>`;
  go(state.tab);
}

function go(tab) {
  state.tab = tab;
  state.editor?.destroy();
  state.editor = null;
  root.querySelectorAll('[data-tab]').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('is-active', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const main = document.getElementById('admin-main');
  main.innerHTML = '<p class="admin__loading">Loading…</p>';
  const views = {
    overview: viewOverview, blog: viewBlog, projects: () => viewCrud('projects'), skills: () => viewCrud('skills'),
    experiences: () => viewCrud('experiences'), messages: viewMessages, comments: viewComments,
  };
  Promise.resolve(views[tab](main)).catch((error) => {
    console.error(error);
    main.innerHTML = `<p class="admin__error" role="alert">${esc(explain(error))}</p>`;
  });
}

// ── overview ────────────────────────────────────────────────
async function viewOverview(main) {
  const [posts, projects, skills, messages] = await Promise.all([
    api.listAll('blog_posts'), api.listAll('projects'), api.listAll('skills'), api.listAll('contact_messages'),
  ]);
  const published = posts.filter((p) => p.published).length;
  const unread = messages.filter((m) => !m.read).length;
  const stats = [
    ['Posts', posts.length, `${published} published · ${posts.length - published} drafts`],
    ['Projects', projects.length, 'in the database'],
    ['Skill groups', skills.length, 'in the database'],
    ['Messages', messages.length, `${unread} unread`],
  ];
  main.innerHTML = `
    <header class="admin__head"><h1>Overview</h1></header>
    <div class="stats">${list(stats, ([label, n, note]) => `<div class="stat"><p class="label">${label}</p><p class="stat__n">${n}</p><p class="stat__note">${esc(note)}</p></div>`)}</div>
    <section class="panel">
      <h2>Fill the database from your portfolio</h2>
      <p>Writes your projects, skill groups, education and one sample draft post (from <code>src/data/content.js</code>) into Firestore. Existing documents with the same ids are overwritten, so run it once on a fresh database.</p>
      <button type="button" class="btn btn--ink" data-seed>Seed database</button>
    </section>`;
}

// ── blog ────────────────────────────────────────────────────
async function viewBlog(main) {
  const posts = (await api.listAll('blog_posts')).sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
  main.innerHTML = `
    <header class="admin__head"><h1>Blog</h1><button type="button" class="btn btn--ink btn--sm" data-new-post>New post</button></header>
    ${posts.length ? `<div class="table-wrap"><table class="table">
      <thead><tr><th>Title</th><th>Status</th><th>Views</th><th>Created</th><th><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>${list(posts, (p) => `<tr>
        <td><strong>${esc(p.title)}</strong><br><span class="label">/${esc(p.slug)}</span></td>
        <td><span class="pill ${p.published ? 'pill--on' : ''}">${p.published ? 'Published' : 'Draft'}</span></td>
        <td>${p.views ?? 0}</td><td>${esc(when(p.createdAt))}</td>
        <td class="table__actions">
          <button type="button" class="link-btn" data-edit-post="${esc(p.id)}">Edit</button>
          <button type="button" class="link-btn" data-toggle-post="${esc(p.id)}" data-to="${p.published ? 'draft' : 'publish'}">${p.published ? 'Unpublish' : 'Publish'}</button>
          <button type="button" class="link-btn link-btn--danger" data-delete-post="${esc(p.id)}">Delete</button>
        </td></tr>`)}</tbody></table></div>` : '<p class="panel">No posts yet. Create the first one.</p>'}`;
  state.posts = posts;
}

function viewPostForm(post = null) {
  const main = document.getElementById('admin-main');
  state.editor?.destroy();
  main.innerHTML = `
  <header class="admin__head"><h1>${post ? 'Edit post' : 'New post'}</h1><button type="button" class="btn btn--line btn--sm" data-tab="blog">Back to posts</button></header>
  <form class="form" data-post-form="${post ? esc(post.id) : ''}" novalidate>
    <div class="field"><label for="p-title">Title</label><input id="p-title" name="title" maxlength="140" value="${esc(post?.title || '')}" required><p class="field__error" data-err="title"></p></div>
    <div class="field"><label for="p-slug">Slug (the address of the post)</label><input id="p-slug" name="slug" maxlength="80" value="${esc(post?.slug || '')}" required><p class="field__error" data-err="slug"></p></div>
    <div class="field"><label for="p-excerpt">Excerpt (leave empty to generate one)</label><textarea id="p-excerpt" name="excerpt" rows="2" maxlength="300">${esc(post?.excerpt || '')}</textarea><p class="field__error" data-err="excerpt"></p></div>
    <div class="field"><label for="p-tags">Tags (comma separated)</label><input id="p-tags" name="tags" value="${esc((post?.tags || []).join(', '))}"><p class="field__error" data-err="tags"></p></div>
    <div class="field">
      <label for="p-cover">Cover image URL</label>
      <div class="inline"><input id="p-cover" name="coverImage" value="${esc(post?.coverImage || '')}" placeholder="https://… or upload →"><button type="button" class="btn btn--line btn--sm" data-upload-cover>Upload</button></div>
      <input type="file" accept="image/*" hidden data-cover-file>
      <p class="field__error" data-err="coverImage"></p>
      ${post?.coverImage ? `<img class="cover-preview" src="${esc(post.coverImage)}" alt="Current cover">` : ''}
    </div>
    <div class="field"><span class="field__label">Content</span><div class="editor" data-editor></div><p class="field__error" data-err="content"></p></div>
    <label class="check"><input type="checkbox" name="published"${post?.published ? ' checked' : ''}> Published (visible on the public blog)</label>
    <div class="form__actions"><button class="btn btn--ink" type="submit">Save post</button></div>
  </form>`;
  state.editor = createEditor(main.querySelector('[data-editor]'), {
    content: post?.content || '',
    upload: (file) => api.uploadImage(file, 'blog'),
    onError: (message) => toast(message, 'error', 6000),
  });
}

async function submitPost(form) {
  const id = form.dataset.postForm || null;
  const raw = Object.fromEntries(new FormData(form));
  const content = state.editor.isEmpty() ? '' : state.editor.getHTML();
  const data = {
    title: raw.title, slug: raw.slug || slugify(raw.title), excerpt: raw.excerpt || makeExcerpt(content),
    content, coverImage: raw.coverImage || '', tags: parseCsv(raw.tags || ''), published: form.elements.published.checked,
  };
  const result = postSchema.safeParse(data);
  if (!result.success) {
    showErrors(form, fieldErrors(result.error));
    return toast('Please fix the highlighted fields.', 'error');
  }
  showErrors(form, {});
  const saved = await act(() => api.savePost(id, { ...result.data, readingTime: readingTime(content) }), 'Post saved.');
  if (saved) go('blog');
}

// ── generic CRUD (projects, skills, education) ─────────────
const CRUD = {
  projects: {
    title: 'Projects', schema: projectSchema, item: (d) => d.title, sub: (d) => `${d.kind || d.category || ''} · order ${d.displayOrder ?? 0}`,
    fields: [
      ['title', 'Title', 'text'], ['slug', 'Slug (built-in projects use edutrack, algovisualizer, allocator)', 'text'],
      ['category', 'Category (used for filters, e.g. C++)', 'text'], ['kind', 'Kind (e.g. C++ · OOP)', 'text'], ['status', 'Status', 'text'],
      ['summary', 'Summary', 'textarea'], ['problem', 'Problem', 'textarea'], ['details', 'Implementation details (one per line)', 'lines'],
      ['outcome', 'Outcome', 'textarea'], ['techStack', 'Tech stack (comma separated)', 'csv'], ['imageUrl', 'Image URL', 'text'],
      ['liveUrl', 'Live URL', 'text'], ['githubUrl', 'GitHub URL', 'text'], ['featured', 'Featured', 'check'], ['displayOrder', 'Display order', 'number'],
    ],
    blank: { status: 'Concept project', displayOrder: 10 },
  },
  skills: {
    title: 'Skills', schema: skillSchema, item: (d) => d.group, sub: (d) => `${d.level} · ${(d.items || []).join(', ')}`,
    fields: [
      ['group', 'Group name', 'text'], ['level', 'Level', ['practiced', 'learning', 'exploring']], ['note', 'Short note', 'text'],
      ['items', 'Items (comma separated)', 'csv'], ['displayOrder', 'Display order', 'number'],
    ],
    blank: { level: 'learning', displayOrder: 10 },
  },
  experiences: {
    title: 'Education & recognition', schema: experienceSchema, item: (d) => d.title, sub: (d) => `${d.kind} · ${d.place || ''}`,
    fields: [
      ['kind', 'Kind', ['education', 'recognition']], ['title', 'Title', 'text'], ['place', 'Place', 'text'],
      ['period', 'Period (e.g. 2026 — 2030)', 'text'], ['note', 'Note / label (e.g. Expected, Distinction)', 'text'],
      ['text', 'Description', 'textarea'], ['displayOrder', 'Display order', 'number'],
    ],
    blank: { kind: 'education', displayOrder: 10 },
  },
};

async function viewCrud(name) {
  const cfg = CRUD[name];
  const items = (await api.listAll(name)).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  state.items = items;
  document.getElementById('admin-main').innerHTML = `
    <header class="admin__head"><h1>${cfg.title}</h1><button type="button" class="btn btn--ink btn--sm" data-new-item="${name}">Add new</button></header>
    ${items.length ? `<ul class="rows">${list(items, (d) => `<li class="rows__item">
      <div><strong>${esc(cfg.item(d))}</strong><p class="rows__sub">${esc(cfg.sub(d))}</p></div>
      <div class="table__actions">
        <button type="button" class="link-btn" data-edit-item="${name}" data-id="${esc(d.id)}">Edit</button>
        <button type="button" class="link-btn link-btn--danger" data-delete-item="${name}" data-id="${esc(d.id)}">Delete</button>
      </div></li>`)}</ul>` : '<p class="panel">Nothing here yet. Use “Add new”, or seed the database from the Overview tab.</p>'}`;
}

const toFieldValue = (type, value) => {
  if (type === 'csv') return (value || []).join(', ');
  if (type === 'lines') return (value || []).join('\n');
  return value ?? '';
};

function viewCrudForm(name, doc = null) {
  const cfg = CRUD[name];
  const values = { ...cfg.blank, ...(doc || {}) };
  const input = ([key, label, type]) => {
    const v = toFieldValue(type, values[key]);
    const id = `f-${key}`;
    let control;
    if (type === 'textarea' || type === 'lines') control = `<textarea id="${id}" name="${key}" rows="${type === 'lines' ? 5 : 3}">${esc(v)}</textarea>`;
    else if (Array.isArray(type)) control = `<select id="${id}" name="${key}">${type.map((o) => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
    else if (type === 'check') return `<label class="check"><input type="checkbox" name="${key}"${values[key] ? ' checked' : ''}> ${label}</label>`;
    else control = `<input id="${id}" name="${key}" type="${type === 'number' ? 'number' : 'text'}" value="${esc(v)}">`;
    return `<div class="field"><label for="${id}">${label}</label>${control}<p class="field__error" data-err="${key}"></p></div>`;
  };
  document.getElementById('admin-main').innerHTML = `
    <header class="admin__head"><h1>${doc ? 'Edit' : 'Add'} — ${cfg.title}</h1><button type="button" class="btn btn--line btn--sm" data-tab="${name}">Back</button></header>
    <form class="form" data-crud-form="${name}" data-id="${doc ? esc(doc.id) : ''}" novalidate>
      ${cfg.fields.map(input).join('')}
      <div class="form__actions"><button class="btn btn--ink" type="submit">Save</button></div>
    </form>`;
}

async function submitCrud(form) {
  const name = form.dataset.crudForm;
  const cfg = CRUD[name];
  const raw = Object.fromEntries(new FormData(form));
  const data = {};
  cfg.fields.forEach(([key, , type]) => {
    if (type === 'csv') data[key] = parseCsv(raw[key] || '');
    else if (type === 'lines') data[key] = parseLines(raw[key] || '');
    else if (type === 'check') data[key] = form.elements[key].checked;
    else data[key] = raw[key] ?? '';
  });
  if (name === 'projects' && !data.slug) data.slug = slugify(data.title);
  const result = cfg.schema.safeParse(data);
  if (!result.success) {
    showErrors(form, fieldErrors(result.error));
    return toast('Please fix the highlighted fields.', 'error');
  }
  showErrors(form, {});
  const id = form.dataset.id || null;
  const saved = await act(() => api.saveDoc(name, id, result.data), 'Saved.');
  if (saved) go(name);
}

// ── messages & comments ─────────────────────────────────────
async function viewMessages(main) {
  const msgs = (await api.listAll('contact_messages')).sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
  main.innerHTML = `<header class="admin__head"><h1>Messages</h1></header>
  ${msgs.length ? `<ul class="rows">${list(msgs, (m) => `<li class="rows__item rows__item--col${m.read ? '' : ' is-unread'}">
    <div class="msg__top"><strong>${esc(m.name)}</strong> <a href="mailto:${esc(m.email)}">${esc(m.email)}</a> <span class="label">${esc(when(m.createdAt))}</span>${m.read ? '' : ' <span class="pill pill--on">New</span>'}</div>
    ${m.subject ? `<p class="rows__sub">${esc(m.subject)}</p>` : ''}
    <p class="msg__body">${esc(m.message)}</p>
    <div class="table__actions">
      <button type="button" class="link-btn" data-read="${esc(m.id)}" data-to="${m.read ? 'unread' : 'read'}">Mark ${m.read ? 'unread' : 'read'}</button>
      <a class="link-btn" href="mailto:${esc(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject || 'your message'}`)}">Reply</a>
      <button type="button" class="link-btn link-btn--danger" data-delete-msg="${esc(m.id)}">Delete</button>
    </div></li>`)}</ul>` : '<p class="panel">No messages yet.</p>'}`;
}

async function viewComments(main) {
  const comments = (await api.listComments()).sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
  state.comments = comments;
  main.innerHTML = `<header class="admin__head"><h1>Comments</h1></header>
  ${comments.length ? `<ul class="rows">${list(comments, (c, i) => `<li class="rows__item">
    <div><strong>${esc(c.name)}</strong> <span class="label">${esc(when(c.createdAt))} · post ${esc(c._path.split('/')[1])}</span><p class="msg__body">${esc(c.content)}</p></div>
    <button type="button" class="link-btn link-btn--danger" data-delete-comment="${i}">Delete</button></li>`)}</ul>` : '<p class="panel">No comments yet.</p>'}`;
}

// ── events ──────────────────────────────────────────────────
root.addEventListener('click', async (event) => {
  const t = event.target.closest('button, a');
  if (!t) return;
  const d = t.dataset;
  const confirmed = (text) => window.confirm(text);

  if (d.tab) return go(d.tab);
  if ('logout' in d) return act(() => api.logout());
  if ('verify' in d) return act(() => api.sendVerification(), 'Verification email sent. Open it, then reload this page.');
  if ('google' in d) return act(() => api.loginWithGoogle());
  if ('seed' in d) {
    if (!confirmed('Write the portfolio content into Firestore? Documents with the same ids will be overwritten.')) return;
    t.disabled = true;
    const count = await act(() => api.seedDatabase(), 'Database seeded.');
    t.disabled = false;
    if (count) toast(`${count} documents written.`, 'info');
    return go('overview');
  }
  if ('newPost' in d) return viewPostForm();
  if (d.editPost) return viewPostForm(state.posts.find((p) => p.id === d.editPost));
  if (d.togglePost) {
    await act(() => api.setPublished(d.togglePost, d.to === 'publish'), d.to === 'publish' ? 'Post published.' : 'Post moved to drafts.');
    return go('blog');
  }
  if (d.deletePost) {
    if (!confirmed('Delete this post permanently?')) return;
    await act(() => api.removeDoc('blog_posts', d.deletePost), 'Post deleted.');
    return go('blog');
  }
  if ('uploadCover' in d) return document.querySelector('[data-cover-file]').click();
  if ('newItem' in d) return viewCrudForm(d.newItem);
  if (d.editItem) return viewCrudForm(d.editItem, state.items.find((i) => i.id === d.id));
  if (d.deleteItem) {
    if (!confirmed('Delete this entry permanently?')) return;
    await act(() => api.removeDoc(d.deleteItem, d.id), 'Deleted.');
    return go(d.deleteItem);
  }
  if (d.read) {
    await act(() => api.setMessageRead(d.read, d.to === 'read'));
    return go('messages');
  }
  if (d.deleteMsg) {
    if (!confirmed('Delete this message permanently?')) return;
    await act(() => api.removeDoc('contact_messages', d.deleteMsg), 'Message deleted.');
    return go('messages');
  }
  if (d.deleteComment) {
    if (!confirmed('Delete this comment permanently?')) return;
    await act(() => api.removeComment(state.comments[Number(d.deleteComment)]._path), 'Comment deleted.');
    return go('comments');
  }
});

root.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    if (form.matches('[data-login]')) {
      const { email, password } = Object.fromEntries(new FormData(form));
      const ok = await act(() => api.loginWithEmail(email, password));
      if (ok === undefined) viewLogin('Sign in failed. Check your details and try again.');
    } else if (form.matches('[data-post-form]')) await submitPost(form);
    else if (form.matches('[data-crud-form]')) await submitCrud(form);
  } finally {
    button.disabled = false;
  }
});

root.addEventListener('change', async (event) => {
  if (!event.target.matches('[data-cover-file]')) return;
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  const url = await act(() => api.uploadImage(file, 'blog'), 'Image uploaded.');
  if (url) document.getElementById('p-cover').value = url;
});

root.addEventListener('input', (event) => {
  // Suggest a slug from the title until the owner edits the slug by hand.
  const form = event.target.closest('[data-post-form]');
  if (!form || event.target.name !== 'title') return;
  const slug = form.elements.slug;
  if (!slug.dataset.touched && !form.dataset.postForm) slug.value = slugify(event.target.value);
});
root.addEventListener('input', (event) => {
  if (event.target.name === 'slug') event.target.dataset.touched = '1';
});

// ── start ───────────────────────────────────────────────────
if (!api.firebaseReady) {
  root.innerHTML = '<main class="login"><div class="login__card"><h1 class="login__title">Firebase is not configured</h1><p>Add the VITE_FIREBASE_* values to <code>.env</code> and restart the dev server.</p></div></main>';
} else {
  viewLogin();
  api.watchAuth((user) => {
    state.user = user;
    if (!user) return viewLogin();
    if (!api.isAdminUser(user)) return viewDenied(user);
    viewShell();
  });
}
