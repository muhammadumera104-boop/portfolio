// Build-time SEO output: the <head> block for each page, sitemap.xml and robots.txt. Pure functions.
import { esc } from '../src/render/util.js';
import { SITE, jsonLdText } from '../src/shared/seo.js';

export const DEFAULT_IMAGE = { path: '/og-image.png', alt: 'M. Umer — Software, from the ground up.', width: 1200, height: 630 };

/** The site's public address, without a trailing slash. Vercel provides the production domain at build time. */
export function resolveSiteUrl(env = {}) {
  const raw =
    env.VITE_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (env.VERCEL_URL && `https://${env.VERCEL_URL}`) ||
    'http://localhost:4173';
  return String(raw).replace(/\/+$/, '');
}

const GA_ID = /^G-[A-Z0-9]{4,20}$/;

/** Google Analytics 4, only when a valid measurement id (G-XXXXXXXX) is configured. IP anonymisation is on. */
export const analyticsSnippet = (id) =>
  GA_ID.test(String(id || ''))
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});</script>`
    : '';

const tag = (name, content) => (content ? `<meta name="${name}" content="${esc(content)}">` : '');
const prop = (name, content) => (content ? `<meta property="${name}" content="${esc(content)}">` : '');

/**
 * Everything SEO-related that goes in <head>. Callers wrap it in <!--seo:start-->/<!--seo:end--> markers
 * (swap() does) so it can be replaced per page.
 * `image` is absolute; `imageSize` is only given when the real size is known.
 */
export function headBlock({
  siteUrl, title, description, path, image, imageAlt, imageSize, type = 'website', jsonLd,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  published, modified, tags = [], verification = '', bing = '', analyticsId = '',
}) {
  const canonical = `${siteUrl}${path}`;
  return [
    `<title>${esc(title)}</title>`,
    tag('description', description),
    tag('author', SITE.name),
    tag('robots', robots),
    tag('google-site-verification', verification),
    tag('msvalidate.01', bing),
    `<link rel="canonical" href="${esc(canonical)}">`,
    prop('og:site_name', SITE.name),
    prop('og:locale', SITE.locale),
    prop('og:type', type),
    prop('og:title', title),
    prop('og:description', description),
    prop('og:url', canonical),
    prop('og:image', image),
    prop('og:image:alt', imageAlt),
    imageSize ? prop('og:image:width', String(imageSize.width)) : '',
    imageSize ? prop('og:image:height', String(imageSize.height)) : '',
    type === 'article' ? prop('article:published_time', published) : '',
    type === 'article' ? prop('article:modified_time', modified) : '',
    type === 'article' ? prop('article:author', SITE.name) : '',
    ...(type === 'article' ? tags.map((t) => prop('article:tag', t)) : []),
    tag('twitter:card', 'summary_large_image'),
    tag('twitter:title', title),
    tag('twitter:description', description),
    tag('twitter:image', image),
    tag('twitter:image:alt', imageAlt),
    jsonLd ? `<script type="application/ld+json" data-ld="page">${jsonLdText(jsonLd)}</script>` : '',
    analyticsSnippet(analyticsId),
  ]
    .filter(Boolean)
    .join('\n  ');
}

/** Replaces what sits between <!--name:start--> and <!--name:end-->. */
export function swap(html, name, content) {
  const pattern = new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`);
  if (!pattern.test(html)) throw new Error(`Marker "${name}" not found in the page template.`);
  return html.replace(pattern, () => `<!--${name}:start-->${content}<!--${name}:end-->`);
}

const day = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : undefined;
};

/** @param {{path: string, lastmod?: string|Date}[]} entries */
export function sitemapXml(siteUrl, entries) {
  const rows = entries
    .map(({ path, lastmod }) => `  <url>\n    <loc>${esc(siteUrl + path)}</loc>${day(lastmod) ? `\n    <lastmod>${day(lastmod)}</lastmod>` : ''}\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

export const robotsTxt = (siteUrl) =>
  `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
