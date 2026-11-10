// Vite plugin that makes the site readable by search engines without running JavaScript:
//  * fills each page's <head> (title, description, canonical, Open Graph, Twitter, JSON-LD)
//  * prerenders the blog list and every published post into /blog/ and /blog/<slug>/
//  * writes sitemap.xml and robots.txt
// Published posts come from Firestore at build time (public REST, no credentials); if that is
// unreachable the posts bundled with the site are used, so the build never fails because of the network.
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { DEFAULT_IMAGE, headBlock, resolveSiteUrl, robotsTxt, sitemapXml, swap } from './seo.js';
import { fetchPublishedPosts } from './firestore-rest.js';
import { SITE, absoluteUrl, blogJsonLd, homeJsonLd, postJsonLd, postPath, snippet, socialImage } from '../src/shared/seo.js';
import { isCloudinaryUrl } from '../src/shared/cloudinary.js';
import { builtInPosts, withBuiltInMedia } from '../src/data/posts.js';
import { makeExcerpt, newestFirst, relatedPosts, toDate } from '../src/shared/utils.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOME = {
  title: 'Muhammad Umer Rizwan — Computer Science Student & Developer in Karachi',
  description: 'Muhammad Umer Rizwan (M. Umer): BSCS student at GU Tech, Karachi. Projects in C, C++, Python and the web, plus a blog on programming and algorithms.',
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

  const site = () => resolveSiteUrl(env);
  const verification = () => env.VITE_GOOGLE_SITE_VERIFICATION || '';
  const load = (path) => (server ? server.ssrLoadModule(path) : import(/* @vite-ignore */ pathToFileURL(resolve(config.root, `.${path}`)).href));

  /** Head block for the pages that are not prerendered per post. */
  const pageHead = (name) => {
    const siteUrl = site();
    const image = absoluteUrl(siteUrl, DEFAULT_IMAGE.path);
    const common = { siteUrl, image, imageAlt: DEFAULT_IMAGE.alt, imageSize: DEFAULT_IMAGE, verification: verification() };
    if (name === 'index.html') return headBlock({ ...common, ...HOME, path: '/', jsonLd: homeJsonLd(siteUrl) });
    if (name === 'blog.html') return headBlock({ ...common, ...BLOG, path: '/blog/', jsonLd: blogJsonLd(siteUrl, []) });
    // post.html is the shell served for posts published after the last deploy; the page script fills in the real tags.
    return headBlock({ ...common, title: 'Blog post — Muhammad Umer Rizwan', description: 'A post from the blog of Muhammad Umer Rizwan.', path: '/blog/', type: 'article' });
  };

  async function collectPosts() {
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    let live = [];
    if (projectId) {
      try {
        live = await fetchPublishedPosts(projectId);
      } catch (error) {
        console.warn(`[seo] could not read posts from Firestore (${error.message}); using the built-in posts.`);
      }
    }
    const source = live.length ? live.map(withBuiltInMedia) : builtInPosts.map((p) => ({ ...p, id: `built-in:${p.slug}` }));
    const valid = source.filter((p) => {
      const ok = SLUG.test(String(p.slug || '')) && p.title && p.content;
      if (!ok) console.warn(`[seo] skipping a post without a valid slug/title/content: ${p.slug}`);
      return ok;
    });
    console.log(`[seo] prerendering ${valid.length} post(s) from ${live.length ? 'Firestore' : 'the built-in posts'}.`);
    return valid.sort(newestFirst);
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
        next();
      });
    },

    // Fills the <!--seo--> and <!--shell--> placeholders of the source pages.
    async transformIndexHtml(html, ctx) {
      const name = basename(ctx.filename || ctx.path || '');
      if (name === 'admin.html') return html;
      let out = html.replace('<!--seo-->', () => `<!--seo:start-->${pageHead(name)}<!--seo:end-->`);
      if (out.includes('<!--shell-->')) {
        const { shellHtml } = await load('/src/render/shell.js');
        out = out.replace('<!--shell-->', () => `<!--shell:start-->${shellHtml({ current: '/blog/' })}<!--shell:end-->`);
      }
      return out;
    },

    buildEnd(error) {
      buildFailed = Boolean(error);
    },

    async writeBundle() {
      if (config.command !== 'build' || buildFailed) return;
      const outDir = resolve(config.root, config.build.outDir);
      const siteUrl = site();
      const [{ JSDOM }, { default: createPurify }, { cleanPostHtml }, { articleHtml, blogPageHtml }, { shellHtml }] = await Promise.all([
        import('jsdom'),
        import('dompurify'),
        import('../src/shared/sanitize.js'),
        import('../src/render/blog.js'),
        import('../src/render/shell.js'),
      ]);
      const purify = createPurify(new JSDOM('').window);
      const posts = await collectPosts();

      const blogTemplate = await readFile(resolve(outDir, 'blog.html'), 'utf8');
      const postTemplate = await readFile(resolve(outDir, 'post.html'), 'utf8');
      const image = absoluteUrl(siteUrl, DEFAULT_IMAGE.path);

      // /blog/ — every post card in the HTML.
      let blogPage = swap(
        blogTemplate,
        'seo',
        headBlock({ siteUrl, ...BLOG, path: '/blog/', image, imageAlt: DEFAULT_IMAGE.alt, imageSize: DEFAULT_IMAGE, jsonLd: blogJsonLd(siteUrl, posts), verification: verification() }),
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
            verification: verification(),
          }),
        );
        const inner = articleHtml(post, {
          url,
          bodyHtml: cleanPostHtml(post.content, purify),
          related: relatedPosts(post, posts),
        });
        page = swap(page, 'shell', shellHtml({ current: '/blog/', inner }));
        await mkdir(resolve(outDir, 'blog', post.slug), { recursive: true });
        await writeFile(resolve(outDir, 'blog', post.slug, 'index.html'), page);
      }

      const now = new Date();
      const entries = [
        { path: '/', lastmod: now },
        { path: '/blog/', lastmod: posts[0] ? toDate(posts[0].updatedAt) || toDate(posts[0].createdAt) : now },
        ...posts.map((p) => ({ path: postPath(p.slug), lastmod: toDate(p.updatedAt) || toDate(p.createdAt) })),
      ];
      await writeFile(resolve(outDir, 'sitemap.xml'), sitemapXml(siteUrl, entries));
      await writeFile(resolve(outDir, 'robots.txt'), robotsTxt(siteUrl));
      console.log(`[seo] wrote ${posts.length + 1} prerendered pages, sitemap.xml and robots.txt for ${siteUrl}`);
    },
  };
}
