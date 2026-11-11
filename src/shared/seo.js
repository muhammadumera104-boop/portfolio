// Pure SEO helpers shared by the build (prerendered pages, sitemap) and the browser (dynamic pages).
import { optimizeImage } from './cloudinary.js';
import { normalizeVideos, normalizeResources } from './media.js';
import { repoUrl } from './utils.js';

export const SITE = {
  name: 'Muhammad Umer Rizwan',
  shortName: 'M. Umer',
  email: 'muhammadumera104@gmail.com',
  locale: 'en_US',
  sameAs: ['https://github.com/muhammadumera104-boop', 'https://www.linkedin.com/in/muhammad-umer-7aaa73436'],
};

const trimSlash = (value) => String(value).replace(/\/+$/, '');

/** "/blog/" or "images/x.jpg" or a full URL -> a full URL on `siteUrl`. */
export function absoluteUrl(siteUrl, path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${trimSlash(siteUrl)}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Site-root path of a project page. */
export const projectPath = (slug) => `/projects/${encodeURIComponent(slug)}/`;

/** Site-root path of a post page. */
export const postPath = (slug) => `/blog/${encodeURIComponent(slug)}/`;

/** Root-relative form of a local image path so it works from /blog/some-post/ as well as from /. */
export const rootPath = (src) => (!src || /^(https?:)?\/\//i.test(src) || src.startsWith('/') ? src : `/${src}`);

/** The image to use for social previews: Cloudinary images are cropped to 1200x630. */
export function socialImage(siteUrl, src) {
  const abs = absoluteUrl(siteUrl, rootPath(src));
  return optimizeImage(abs, { width: 1200, height: 630 });
}

const iso = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
};

/** schema.org graph for a post: BlogPosting + breadcrumbs. */
export function postJsonLd({ siteUrl, post, description, published, modified }) {
  const url = absoluteUrl(siteUrl, postPath(post.slug));
  const image = post.coverImage ? socialImage(siteUrl, post.coverImage) : undefined;
  const citations = [...normalizeVideos(post.videos).map((v) => v.href), ...normalizeResources(post.resources).map((r) => r.url)];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#post`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        headline: post.title.slice(0, 110),
        ...(post.subtitle ? { alternativeHeadline: post.subtitle.slice(0, 110) } : {}),
        ...(post.category ? { articleSection: post.category } : {}),
        description,
        ...(image ? { image: [image] } : {}),
        datePublished: iso(published),
        dateModified: iso(modified || published),
        inLanguage: 'en',
        keywords: (post.tags || []).join(', ') || undefined,
        author: { '@type': 'Person', name: post.authorName || SITE.name, url: absoluteUrl(siteUrl, '/') },
        publisher: { '@type': 'Person', name: SITE.name, url: absoluteUrl(siteUrl, '/') },
        ...(citations.length ? { citation: citations } : {}),
      },
      breadcrumbs(siteUrl, [
        ['Home', '/'],
        ['Blog', '/blog/'],
        [post.title, postPath(post.slug)],
      ]),
    ],
  };
}

/** schema.org graph for a project page: a software application (or creative work) plus breadcrumbs. */
export function projectJsonLd({ siteUrl, project, description }) {
  const url = absoluteUrl(siteUrl, projectPath(project.slug));
  const live = project.liveUrl ? absoluteUrl(siteUrl, rootPath(project.liveUrl)) : '';
  const image = project.imageUrl ? socialImage(siteUrl, project.imageUrl) : undefined;
  const sameAs = [repoUrl(project.githubUrl)].filter(Boolean);
  const shared = {
    '@id': `${url}#project`,
    name: project.title,
    description,
    url,
    mainEntityOfPage: url,
    ...(image ? { image } : {}),
    inLanguage: 'en',
    keywords: (project.techStack || []).join(', ') || undefined,
    author: { '@type': 'Person', name: SITE.name, url: absoluteUrl(siteUrl, '/') },
    ...(sameAs.length ? { sameAs } : {}),
  };
  const main = live
    ? { '@type': 'SoftwareApplication', ...shared, applicationCategory: 'WebApplication', operatingSystem: 'Any (web browser)', installUrl: live }
    : { '@type': 'CreativeWork', ...shared };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      main,
      breadcrumbs(siteUrl, [
        ['Home', '/'],
        ['Projects', '/#projects'],
        [project.title, projectPath(project.slug)],
      ]),
    ],
  };
}

export function breadcrumbs(siteUrl, trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absoluteUrl(siteUrl, path),
    })),
  };
}

/** schema.org graph for the home page: person + website + profile page. */
export function homeJsonLd(siteUrl, { projects = [], video = null } = {}) {
  const home = absoluteUrl(siteUrl, '/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${home}#person`,
        name: SITE.name,
        alternateName: ['Umer Lakhani', 'M. Umer', 'Muhammad Umer', 'Umer Rizwan'],
        url: home,
        image: absoluteUrl(siteUrl, '/images/umer-rizwan.jpg'),
        email: `mailto:${SITE.email}`,
        jobTitle: 'Computer Science student & software developer',
        description: 'BSCS student at GU TECH, Karachi, building projects in C, C++, Python and web development.',
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'GU TECH' },
        address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressCountry: 'PK' },
        knowsAbout: ['C', 'C++', 'Python', 'JavaScript', 'Data structures', 'Algorithms', 'Web development'],
        sameAs: SITE.sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        url: home,
        name: `${SITE.name} — Portfolio`,
        alternateName: ['Umer Lakhani — Portfolio'],
        inLanguage: 'en',
        publisher: { '@id': `${home}#person` },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${home}#profile`,
        url: home,
        name: `${SITE.name} — Computer Science Student & Developer`,
        mainEntity: { '@id': `${home}#person` },
        isPartOf: { '@id': `${home}#website` },
      },
      ...(video && video.src
        ? [{
            '@type': 'VideoObject',
            '@id': `${home}#intro-video`,
            name: video.title,
            description: video.description,
            thumbnailUrl: [absoluteUrl(siteUrl, video.poster)],
            uploadDate: video.uploadDate,
            duration: video.duration,
            contentUrl: absoluteUrl(siteUrl, video.src),
            inLanguage: 'en',
            transcript: (video.transcript || []).join(' '),
            author: { '@id': `${home}#person` },
          }]
        : []),
      ...(projects.length
        ? [{
            '@type': 'ItemList',
            '@id': `${home}#projects`,
            name: 'Projects',
            itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: absoluteUrl(siteUrl, p.url) })),
          }]
        : []),
    ],
  };
}

export function blogJsonLd(siteUrl, posts) {
  const url = absoluteUrl(siteUrl, '/blog/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${url}#blog`,
        url,
        name: `${SITE.name} — Blog`,
        description: 'Notes on programming, algorithms and learning to build for the web.',
        inLanguage: 'en',
        author: { '@type': 'Person', name: SITE.name, url: absoluteUrl(siteUrl, '/') },
        blogPost: posts.slice(0, 20).map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          url: absoluteUrl(siteUrl, postPath(p.slug)),
          datePublished: iso(p.createdAt),
        })),
      },
      breadcrumbs(siteUrl, [
        ['Home', '/'],
        ['Blog', '/blog/'],
      ]),
    ],
  };
}

/** JSON for a <script type="application/ld+json">: '<' is escaped so the data can never close the tag. */
export const jsonLdText = (data) => JSON.stringify(data).replaceAll('<', '\\u003c');

/** Shortens text to a search-snippet length on a word boundary. */
export function snippet(text, max = 158) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).trim()}…`;
}
