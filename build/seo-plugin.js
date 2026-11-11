// Vite plugin that makes the site readable by search engines without running JavaScript:
//  * fills each page's <head> (title, description, canonical, Open Graph, Twitter, JSON-LD, verification tags, analytics)
//  * prerenders the blog list, every published post and every project into /blog/, /blog/<slug>/, /projects/<slug>/
//  * puts the latest posts on the home page, and builds the 404 page
//  * writes sitemap.xml and robots.txt
// Posts and projects come from Firestore at build time (public REST, no credentials); if that is unreachable the
// content bundled with the site is used, so the build never fails because of the network.
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { DEFAULT_IMAGE, headBlock, resolveSiteUrl, robotsTxt, sitemapXml, swap } from './seo.js';
import { fetchProjects, fetchPublishedPosts } from './firestore-rest.js';
import { SITE, absoluteUrl, blogJsonLd, homeJsonLd, postJsonLd, postPath, projectJsonLd, projectPath, snippet, socialImage } from '../src/shared/seo.js';
import { isCloudinaryUrl } from '../src/shared/cloudinary.js';
import { builtInPosts, withBuiltInDefaults } from '../src/data/posts.js';
import { projects as builtInProjects, webProjects, withBuiltInProjectDefaults, introVideo } from '../src/data/content.js';
import { buildSeed } from '../src/data/seed.js';
import { makeExcerpt, newestFirst, relatedPosts, toDate } from '../src/shared/utils.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOME = {
  title: 'Muhammad Umer Rizwan (Umer Lakhani) — Developer in Karachi',
  description: 'Muhammad Umer Rizwan, also known as Umer Lakhani: BSCS student at GU TECH, Karachi. Projects in C, C++, Python and the web, and a programming blog.',
};
const BLOG = {
  title: 'Blog — Muhammad Umer Rizwan',
  description: 'Notes on programming, algorithms and building for the web by Muhammad Umer Rizwan, with thumbnails and video guides on every post.',
};

export function seoPlugin() {
  let config;
  let env = {};
  let server;
  let buildFailed = false;
  let postsOnce;
  let projectsOnce;

  const site = () => resolveSiteUrl(env);
  /** Search-console verification tags and the analytics id, all optional and read from the environment. */
  const tracking = () => ({
    verification: env.VITE_GOOGLE_SITE_VERIFICATION || '',
    bing: env.VITE_BING_SITE_VERIFICATION || '',
    analyticsId: env.VITE_GA_MEASUREMENT_ID || '',
  });
  const load = (path) => (server ? server.ssrLoadModule(path) : import(/* @vite-ignore */ pathToFileURL(resolve(config.root, `.${path}`)).href));

  /** Head block for the pages that are not prerendered per post or project. */
  const pageHead = (name, { projects = [] } = {}) => {
    const siteUrl = site();
    const image = absoluteUrl(siteUrl, DEFAULT_IMAGE.path);
    const common = { siteUrl, image, imageAlt: DEFAULT_IMAGE.alt, imageSize: DEFAULT_IMAGE, ...tracking() };
    if (name === 'index.html') {
      const items = [
        ...builtInProjects.map((p) => ({ name: p.title, url: `/#project-${p.id}` })),
        ...projects.map((p) => ({ name: p.title, url: projectPath(p.slug) })),
      ];
      return headBlock({ ...common, ...HOME, path: '/', jsonLd: homeJsonLd(siteUrl, { projects: items, video: introVideo }) });
    }
    if (name === 'blog.html') return headBlock({ ...common, ...BLOG, path: '/blog/', jsonLd: blogJsonLd(siteUrl, []) });
    if (name === '404.html') {
      return headBlock({ ...common, title: 'Page not found — Muhammad Umer Rizwan', description: 'This page does not exist.', path: '/', robots: 'noindex, follow' });
    }
    // post.html / project.html are the shells served for pages published after the last deploy; their scripts fill in the real tags.
    const what = name === 'project.html' ? 'project' : 'post';
    return headBlock({ ...common, title: `${what === 'post' ? 'Blog post' : 'Project'} — Muhammad Umer Rizwan`, description: `A ${what} by Muhammad Umer Rizwan.`, path: '/', type: 'article' });
  };

  function collectPosts() {
    postsOnce ||= (async () => {
      const projectId = env.VITE_FIREBASE_PROJECT_ID;
      let live = [];
      if (projectId) {
        try {
          live = await fetchPublishedPosts(projectId);
        } catch (error) {
          console.warn(`[seo] could not read posts from Firestore (${error.message}); using the built-in posts.`);
        }
      }
      const source = live.length ? live.map(withBuiltInDefaults) : builtInPosts.map((p) => ({ ...p, id: `built-in:${p.slug}` }));
      const valid = source.filter((p) => {
        const ok = SLUG.test(String(p.slug || '')) && p.title && p.content;
        if (!ok) console.warn(`[seo] skipping a post without a valid slug/title/content: ${p.slug}`);
        return ok;
      });
      console.log(`[seo] ${valid.length} post(s) from ${live.length ? 'Firestore' : 'the built-in posts'}.`);
      return valid.sort(newestFirst);
    })();
    return postsOnce;
  }

  function collectProjects() {
    projectsOnce ||= (async () => {
      const projectId = env.VITE_FIREBASE_PROJECT_ID;
      const known = new Set(builtInProjects.map((b) => b.id));
      // The three case studies also get their own page. They start from the built-in data (src/data/content.js) and
      // anything saved in the dashboard (Firestore) wins, so editing them there needs no code change.
      const caseStudies = buildSeed().projects.filter((p) => known.has(p.id)).map((p) => ({ ...p.data, id: p.id }));
      let live = [];
      let fromDb = [];
      if (projectId) {
        try {
          fromDb = await fetchProjects(projectId);
          live = fromDb.filter((p) => !known.has(p.slug)).map(withBuiltInProjectDefaults);
        } catch (error) {
          console.warn(`[seo] could not read projects from Firestore (${error.message}); using the built-in projects.`);
        }
      }
      const mergedCaseStudies = caseStudies.map((c) => ({ ...c, ...(fromDb.find((p) => p.slug === c.slug) || {}) }));
      const source = [...mergedCaseStudies, ...(live.length ? live : webProjects.map((p) => ({ ...p, id: p.slug })))];
      const valid = source.filter((p) => {
        const ok = SLUG.test(String(p.slug || '')) && p.title && p.summary;
        if (!ok) console.warn(`[seo] skipping a project without a valid slug/title/summary: ${p.slug}`);
        return ok;
      });
      console.log(`[seo] ${valid.length} project(s) from ${live.length ? 'Firestore' : 'the built-in projects'}.`);
      return valid.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    })();
    return projectsOnce;
  }

  return {
    name: 'seo',

    configResolved(resolved) {
      config = resolved;
      env = { ...loadEnv(resolved.mode, resolved.envDir || resolved.root, ''), ...process.env };
    },

    configureServer(s) {
      server = s;
      // Dev only: serve the clean URLs the production host provides.
      s.middlewares.use((req, _res, next) => {
        const [path, query] = (req.url || '').split('?');
        if (/^\/blog\/?$/.test(path)) req.url = `/blog.html${query ? `?${query}` : ''}`;
        else if (/^\/blog\/[^/]+\/?$/.test(path)) req.url = '/post.html';
        else if (/^\/projects\/[^/]+\/?$/.test(path)) req.url = '/project.html';
        next();
      });
    },

    // Fills the <!--seo-->, <!--shell--> and <!--latest-posts--> placeholders of the source pages.
    async transformIndexHtml(html, ctx) {
      const name = basename(ctx.filename || ctx.path || '');
      if (name === 'admin.html') return html;
      const projects = name === 'index.html' ? await collectProjects() : [];
      let out = html.replace('<!--seo-->', () => `<!--seo:start-->${pageHead(name, { projects })}<!--seo:end-->`);
      if (out.includes('<!--shell-->')) {
        const { shellHtml, notFoundHtml } = await load('/src/render/shell.js');
        const inner = name === '404.html' ? notFoundHtml() : '';
        out = out.replace('<!--shell-->', () => `<!--shell:start-->${shellHtml({ current: name === '404.html' ? '' : '/blog/', inner })}<!--shell:end-->`);
      }
      if (out.includes('<!--latest-posts-->')) {
        const { latestPostsHtml } = await load('/src/render/blog.js');
        const posts = await collectPosts();
        out = out.replace('<!--latest-posts-->', () => latestPostsHtml(posts.slice(0, 3)));
      }
      return out;
    },

    buildStart() {
      postsOnce = undefined;
      projectsOnce = undefined;
    },

    buildEnd(error) {
      buildFailed = Boolean(error);
    },

    async writeBundle() {
      if (config.command !== 'build' || buildFailed) return;
      const outDir = resolve(config.root, config.build.outDir);
      const siteUrl = site();
      const [{ JSDOM }, { default: createPurify }, { cleanPostHtml }, { articleHtml, blogPageHtml }, { shellHtml }, { projectPageHtml }] = await Promise.all([
        import('jsdom'),
        import('dompurify'),
        import('../src/shared/sanitize.js'),
        import('../src/render/blog.js'),
        import('../src/render/shell.js'),
        import('../src/render/project.js'),
      ]);
      const purify = createPurify(new JSDOM('').window);
      const posts = await collectPosts();
      const projects = await collectProjects();

      const blogTemplate = await readFile(resolve(outDir, 'blog.html'), 'utf8');
      const postTemplate = await readFile(resolve(outDir, 'post.html'), 'utf8');
      const projectTemplate = await readFile(resolve(outDir, 'project.html'), 'utf8');
      const image = absoluteUrl(siteUrl, DEFAULT_IMAGE.path);

      // /blog/ — every post card in the HTML.
      let blogPage = swap(
        blogTemplate,
        'seo',
        headBlock({ siteUrl, ...BLOG, path: '/blog/', image, imageAlt: DEFAULT_IMAGE.alt, imageSize: DEFAULT_IMAGE, jsonLd: blogJsonLd(siteUrl, posts), ...tracking() }),
      );
      blogPage = swap(blogPage, 'shell', shellHtml({ current: '/blog/', inner: blogPageHtml(posts) }));
      await mkdir(resolve(outDir, 'blog'), { recursive: true });
      await writeFile(resolve(outDir, 'blog/index.html'), blogPage);

      // /blog/<slug>/ — one prerendered page per post.
      for (const post of posts) {
        const url = absoluteUrl(siteUrl, postPath(post.slug));
        const description = snippet(post.excerpt || makeExcerpt(post.content));
        const cover = post.coverImage ? socialImage(siteUrl, post.coverImage) : image;
        const sized = !post.coverImage || isCloudinaryUrl(post.coverImage) || post.coverImage.startsWith('images/blog/');
        const published = toDate(post.createdAt);
        const modified = toDate(post.updatedAt) || published;
        let page = swap(
          postTemplate,
          'seo',
          headBlock({
            siteUrl,
            title: `${post.title} — ${SITE.name}`,
            description,
            path: postPath(post.slug),
            image: cover,
            imageAlt: post.coverImage ? `Thumbnail for ${post.title}` : DEFAULT_IMAGE.alt,
            imageSize: sized ? DEFAULT_IMAGE : undefined,
            type: 'article',
            tags: post.tags || [],
            published: published?.toISOString(),
            modified: modified?.toISOString(),
            jsonLd: postJsonLd({ siteUrl, post, description, published, modified }),
            ...tracking(),
          }),
        );
        const inner = articleHtml(post, {
          url,
          bodyHtml: cleanPostHtml(post.content, purify),
          related: relatedPosts(post, posts, 3, { fill: true }),
        });
        page = swap(page, 'shell', shellHtml({ current: '/blog/', inner }));
        await mkdir(resolve(outDir, 'blog', post.slug), { recursive: true });
        await writeFile(resolve(outDir, 'blog', post.slug, 'index.html'), page);
      }

      // /projects/<slug>/ — one prerendered page per project.
      for (const project of projects) {
        const description = snippet(project.summary);
        const cover = project.imageUrl ? socialImage(siteUrl, project.imageUrl) : image;
        let page = swap(
          projectTemplate,
          'seo',
          headBlock({
            siteUrl,
            title: `${project.title} — ${SITE.name}`,
            description,
            path: projectPath(project.slug),
            image: cover,
            imageAlt: project.imageUrl ? `Preview of the ${project.title} project` : DEFAULT_IMAGE.alt,
            imageSize: !project.imageUrl || project.imageUrl.startsWith('images/projects/') || isCloudinaryUrl(project.imageUrl) ? DEFAULT_IMAGE : undefined,
            type: 'website',
            jsonLd: projectJsonLd({ siteUrl, project, description }),
            ...tracking(),
          }),
        );
        page = swap(page, 'shell', shellHtml({ current: '', inner: projectPageHtml(project, { others: projects.filter((p) => p.slug !== project.slug).slice(0, 4) }) }));
        await mkdir(resolve(outDir, 'projects', project.slug), { recursive: true });
        await writeFile(resolve(outDir, 'projects', project.slug, 'index.html'), page);
      }

      const now = new Date();
      const entries = [
        { path: '/', lastmod: now },
        { path: '/blog/', lastmod: posts[0] ? toDate(posts[0].updatedAt) || toDate(posts[0].createdAt) : now },
        ...posts.map((p) => ({ path: postPath(p.slug), lastmod: toDate(p.updatedAt) || toDate(p.createdAt) })),
        ...projects.map((p) => ({ path: projectPath(p.slug), lastmod: toDate(p.updatedAt) || now })),
      ];
      await writeFile(resolve(outDir, 'sitemap.xml'), sitemapXml(siteUrl, entries));
      await writeFile(resolve(outDir, 'robots.txt'), robotsTxt(siteUrl));
      console.log(`[seo] wrote ${posts.length + projects.length + 1} prerendered pages, sitemap.xml and robots.txt for ${siteUrl}`);
    },
  };
}
