import { describe, it, expect } from 'vitest';
import { absoluteUrl, rootPath, postPath, socialImage, postJsonLd, homeJsonLd, blogJsonLd, jsonLdText, snippet } from '../src/shared/seo.js';
import { headBlock, swap, sitemapXml, robotsTxt, resolveSiteUrl } from '../build/seo.js';
import { builtInPosts } from '../src/data/posts.js';

const SITE = 'https://example.com';

describe('urls', () => {
  it('absoluteUrl joins paths and leaves full URLs alone', () => {
    expect(absoluteUrl(SITE, '/blog/')).toBe('https://example.com/blog/');
    expect(absoluteUrl(`${SITE}/`, 'images/a.jpg')).toBe('https://example.com/images/a.jpg');
    expect(absoluteUrl(SITE, 'https://cdn.example.org/a.jpg')).toBe('https://cdn.example.org/a.jpg');
    expect(absoluteUrl(SITE, '')).toBe('');
  });
  it('rootPath makes local paths root-relative so they work from /blog/<slug>/', () => {
    expect(rootPath('images/blog/a.jpg')).toBe('/images/blog/a.jpg');
    expect(rootPath('/images/a.jpg')).toBe('/images/a.jpg');
    expect(rootPath('https://res.cloudinary.com/x/image/upload/a.jpg')).toBe('https://res.cloudinary.com/x/image/upload/a.jpg');
    expect(rootPath('')).toBe('');
  });
  it('postPath encodes the slug', () => {
    expect(postPath('dijkstra-vs-a-star')).toBe('/blog/dijkstra-vs-a-star/');
    expect(postPath('a b')).toBe('/blog/a%20b/');
  });
  it('socialImage is absolute, and Cloudinary images are cropped to 1200x630', () => {
    expect(socialImage(SITE, 'images/blog/a.jpg')).toBe('https://example.com/images/blog/a.jpg');
    expect(socialImage(SITE, 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg')).toContain('c_fill,g_auto,w_1200,h_630');
  });
  it('snippet cuts on a word boundary near the limit', () => {
    const long = 'word '.repeat(80);
    const out = snippet(long, 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
    expect(snippet('  short   text ')).toBe('short text');
  });
});

describe('structured data', () => {
  const post = { ...builtInPosts[1], id: 'x' };

  it('describes a post as a BlogPosting with breadcrumbs, image and dates', () => {
    const data = postJsonLd({ siteUrl: SITE, post, description: 'desc', published: new Date('2026-11-07'), modified: new Date('2026-11-08') });
    const [article, crumbs] = data['@graph'];
    expect(article['@type']).toBe('BlogPosting');
    expect(article.mainEntityOfPage['@id']).toBe('https://example.com/blog/dijkstra-vs-a-star/');
    expect(article.image[0]).toBe('https://example.com/images/blog/dijkstra-vs-a-star.jpg');
    expect(article.datePublished).toBe('2026-11-07T00:00:00.000Z');
    expect(article.dateModified).toBe('2026-11-08T00:00:00.000Z');
    expect(article.keywords).toContain('Algorithms');
    expect(article.citation).toHaveLength(2);
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(['Home', 'Blog', post.title]);
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
  });
  it('keeps the headline within the 110 characters search engines allow', () => {
    const data = postJsonLd({ siteUrl: SITE, post: { ...post, title: 'x'.repeat(200) }, description: 'd', published: new Date() });
    expect(data['@graph'][0].headline).toHaveLength(110);
  });
  it('describes the home page as a person, website and profile page', () => {
    const types = homeJsonLd(SITE)['@graph'].map((n) => n['@type']);
    expect(types).toEqual(['Person', 'WebSite', 'ProfilePage']);
  });
  it('lists posts on the blog page', () => {
    const blog = blogJsonLd(SITE, builtInPosts)['@graph'][0];
    expect(blog['@type']).toBe('Blog');
    expect(blog.blogPost).toHaveLength(builtInPosts.length);
  });
  it('jsonLdText can never close the script tag', () => {
    expect(jsonLdText({ a: '</script><script>alert(1)</script>' })).not.toContain('</script>');
    expect(JSON.parse(jsonLdText({ a: '</script>' })).a).toBe('</script>');
  });
});

describe('headBlock', () => {
  const html = headBlock({
    siteUrl: SITE, title: 'A "quoted" <title>', description: 'Desc & more', path: '/blog/x/', image: `${SITE}/og.png`,
    imageAlt: 'alt', imageSize: { width: 1200, height: 630 }, type: 'article', tags: ['C', 'Web'],
    published: '2026-11-07T00:00:00.000Z', modified: '2026-11-08T00:00:00.000Z', jsonLd: { '@context': 'x' }, verification: 'abc123',
  });
  it('includes canonical, Open Graph, Twitter and article tags', () => {
    expect(html).toContain('<link rel="canonical" href="https://example.com/blog/x/">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/og.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta property="article:tag" content="Web">');
    expect(html).toContain('<meta name="google-site-verification" content="abc123">');
    expect(html).toContain('application/ld+json');
  });
  it('escapes text so a title cannot break out of the attribute or tag', () => {
    expect(html).toContain('<title>A &quot;quoted&quot; &lt;title&gt;</title>');
    expect(html).toContain('content="Desc &amp; more"');
  });
  it('omits optional tags when there is nothing to say', () => {
    const plain = headBlock({ siteUrl: SITE, title: 'T', description: 'D', path: '/' });
    expect(plain).not.toContain('og:image');
    expect(plain).not.toContain('article:');
    expect(plain).not.toContain('google-site-verification');
  });
});

describe('swap', () => {
  it('replaces the content between markers and keeps the markers', () => {
    const out = swap('<head><!--seo:start-->old<!--seo:end--></head>', 'seo', 'new $& text');
    expect(out).toBe('<head><!--seo:start-->new $& text<!--seo:end--></head>');
  });
  it('fails loudly when the template has no marker', () => {
    expect(() => swap('<head></head>', 'seo', 'x')).toThrow(/seo/);
  });
});

describe('sitemap and robots', () => {
  it('lists every page with a lastmod date and escapes URLs', () => {
    const xml = sitemapXml(SITE, [{ path: '/', lastmod: new Date('2026-11-10') }, { path: '/blog/a&b/', lastmod: '2026-11-07T10:00:00Z' }, { path: '/x/' }]);
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<lastmod>2026-11-10</lastmod>');
    expect(xml).toContain('<loc>https://example.com/blog/a&amp;b/</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(3);
    expect(xml.match(/<lastmod>/g)).toHaveLength(2);
  });
  it('robots.txt allows the site, hides admin and api, and points at the sitemap', () => {
    const txt = robotsTxt(SITE);
    expect(txt).toContain('Disallow: /admin.html');
    expect(txt).toContain('Disallow: /api/');
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml');
  });
});

describe('resolveSiteUrl', () => {
  it('prefers VITE_SITE_URL, then the Vercel production domain, then the deployment URL', () => {
    expect(resolveSiteUrl({ VITE_SITE_URL: 'https://me.dev/', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toBe('https://me.dev');
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app', VERCEL_URL: 'y.vercel.app' })).toBe('https://x.vercel.app');
    expect(resolveSiteUrl({ VERCEL_URL: 'y.vercel.app' })).toBe('https://y.vercel.app');
    expect(resolveSiteUrl({})).toBe('http://localhost:4173');
  });
});
