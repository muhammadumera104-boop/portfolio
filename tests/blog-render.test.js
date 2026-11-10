import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { postCard, thumbnailOf, videoGuidesHtml, articleHtml, blogPageHtml, resourcesHtml, authorBoxHtml } from '../src/render/blog.js';
import { filterPosts } from '../src/shared/utils.js';
import { builtInPosts, withBuiltInDefaults } from '../src/data/posts.js';
import { normalizeVideos } from '../src/shared/media.js';
import { postSchema } from '../src/shared/schemas.js';

const base = { slug: 'a-post', title: 'A post', excerpt: 'Excerpt', content: '<p>Body</p>', tags: ['C'], createdAt: '2026-11-07', videos: [] };
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('thumbnailOf', () => {
  it('prefers the cover image, made root-relative', () => {
    expect(thumbnailOf({ ...base, coverImage: 'images/blog/a.jpg' })).toEqual({ src: '/images/blog/a.jpg', kind: 'cover' });
  });
  it('falls back to the first video that has a thumbnail', () => {
    expect(thumbnailOf({ ...base, videos: [{ url: 'https://vimeo.com/123456789' }, { url: YT }] })).toEqual({
      src: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', kind: 'video',
    });
  });
  it('is null when there is nothing to show', () => {
    expect(thumbnailOf(base)).toBeNull();
  });
});

describe('postCard', () => {
  it('links to the clean post URL and shows the thumbnail with a video badge', () => {
    const html = postCard({ ...base, coverImage: 'images/blog/a.jpg', videos: [{ url: YT }] });
    expect(html).toContain('href="/blog/a-post/"');
    expect(html).toContain('src="/images/blog/a.jpg"');
    expect(html).toContain('width="640" height="360"');
    expect(html).toContain('Video guide');
  });
  it('pluralises the badge and optimises Cloudinary thumbnails with a srcset', () => {
    const html = postCard({
      ...base, coverImage: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
      videos: [{ url: YT }, { url: 'https://vimeo.com/123456789' }],
    });
    expect(html).toContain('2 video guides');
    expect(html).toContain('c_fill,g_auto,w_640,h_360,q_auto,f_auto');
    expect(html).toContain('srcset=');
  });
  it('shows a placeholder without a thumbnail, and escapes the title', () => {
    const html = postCard({ ...base, title: '<img src=x onerror=alert(1)>' });
    expect(html).toContain('post-card__img--none');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });
  it('loads the first card eagerly and the rest lazily', () => {
    expect(postCard({ ...base, coverImage: 'a.jpg' }, { eager: true })).toContain('fetchpriority="high"');
    expect(postCard({ ...base, coverImage: 'a.jpg' })).toContain('loading="lazy"');
  });
});

describe('videoGuidesHtml', () => {
  it('renders nothing without valid videos', () => {
    expect(videoGuidesHtml([])).toBe('');
    expect(videoGuidesHtml([{ url: 'https://evil.example/x' }, { url: 'javascript:alert(1)' }])).toBe('');
  });
  it('renders a link card per video with a thumbnail, embed address and provider label', () => {
    const html = videoGuidesHtml([{ url: YT, title: 'Intro "quoted"' }, { url: 'https://vimeo.com/123456789' }, { url: 'https://cdn.example.com/clip.mp4' }]);
    expect(html).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    expect(html).toContain('data-video-embed="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&amp;autoplay=1"');
    expect(html).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
    expect(html).toContain('Intro &quot;quoted&quot;');
    expect(html).toContain('Watch on Vimeo');
    expect(html).toContain('data-video-src="https://cdn.example.com/clip.mp4"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe('articleHtml and blogPageHtml', () => {
  it('renders the article with cover, sanitised body slot, videos, share links and related posts', () => {
    const html = articleHtml({ ...base, coverImage: 'images/blog/a.jpg', videos: [{ url: YT }] }, {
      url: 'https://example.com/blog/a-post/', bodyHtml: '<p>SAFE</p>', related: [{ ...base, slug: 'other', title: 'Other' }], views: 5,
    });
    expect(html).toContain('<h1 class="article__title">A post</h1>');
    expect(html).toContain('alt="Thumbnail for A post"');
    expect(html).toContain('<div class="prose" data-prose><p>SAFE</p></div>');
    expect(html).toContain('Watch &amp; learn');
    expect(html).toContain('href="/blog/other/"');
    expect(html).toContain('<span data-views>5</span> views');
    expect(html).toContain('https%3A%2F%2Fexample.com%2Fblog%2Fa-post%2F');
  });
  it('omits views, cover and video sections when absent', () => {
    const html = articleHtml(base, { url: 'https://example.com/blog/a-post/', bodyHtml: '' });
    expect(html).not.toContain('data-views');
    expect(html).not.toContain('article__cover');
    expect(html).not.toContain('videos-title');
  });
  it('prerenders one card per post on the blog page', () => {
    const html = blogPageHtml(builtInPosts);
    expect(html.match(/class="post-card"/g)).toHaveLength(builtInPosts.length);
    expect(html).toContain('data-prerendered');
  });
});

describe('built-in post media', () => {
  it('gives every built-in post a thumbnail that exists in public/ and at least one valid video', () => {
    for (const post of builtInPosts) {
      expect(post.coverImage, post.slug).toMatch(/^images\/blog\/.+\.jpg$/);
      expect(existsSync(resolve(import.meta.dirname, '../public', post.coverImage)), post.coverImage).toBe(true);
      expect(normalizeVideos(post.videos).length, post.slug).toBe(post.videos.length);
      expect(post.videos.length, post.slug).toBeGreaterThan(0);
    }
  });
  it('every built-in post still passes the post schema', () => {
    for (const post of builtInPosts) {
      const result = postSchema.safeParse(post);
      expect(result.success, `${post.slug}: ${result.success ? '' : JSON.stringify(result.error.issues)}`).toBe(true);
    }
  });
  it('withBuiltInDefaults fills a missing thumbnail and videos for seeded posts, but never overrides the dashboard', () => {
    const seeded = { slug: builtInPosts[0].slug, coverImage: '' };
    const filled = withBuiltInDefaults(seeded);
    expect(filled.coverImage).toBe(builtInPosts[0].coverImage);
    expect(filled.videos).toEqual(builtInPosts[0].videos);

    const edited = withBuiltInDefaults({ slug: builtInPosts[0].slug, coverImage: 'https://res.cloudinary.com/x/image/upload/a.jpg', videos: [] });
    expect(edited.coverImage).toContain('cloudinary');
    expect(edited.videos).toEqual([]);

    const custom = { slug: 'my-own-post', coverImage: '' };
    expect(withBuiltInDefaults(custom)).toBe(custom);
  });
  it('the schema accepts videos as strings (older data) or objects and rejects other links', () => {
    const ok = (videos) => postSchema.safeParse({ ...builtInPosts[0], videos }).success;
    expect(ok([YT, { url: 'https://vimeo.com/123456789', title: 'x' }])).toBe(true);
    expect(ok(['https://evil.example/x'])).toBe(false);
    expect(ok(['javascript:alert(1)'])).toBe(false);
    expect(ok(Array.from({ length: 7 }, (_, i) => `https://vimeo.com/12345678${i}`))).toBe(false);
  });
});

describe('subtitle, category, further reading and author box', () => {
  const post = { ...base, subtitle: 'A <b>sub</b>title', category: 'Algorithms', resources: [{ url: 'https://example.org/a', title: 'Ref A' }, { url: 'http://insecure.example/x', title: 'no' }, { url: 'javascript:alert(1)', title: 'no' }], authorName: 'Muhammad Umer Rizwan' };

  it('shows the subtitle (escaped) and a category link on the post', () => {
    const html = articleHtml(post, { url: 'https://example.com/blog/a-post/', bodyHtml: '' });
    expect(html).toContain('<p class="article__subtitle">A &lt;b&gt;sub&lt;/b&gt;title</p>');
    expect(html).toContain('href="/blog/?category=Algorithms"');
  });
  it('lists only https references, each opening in a new tab', () => {
    const html = resourcesHtml(post.resources);
    expect(html).toContain('Further reading');
    expect(html).toContain('href="https://example.org/a"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('insecure.example');
    expect(html).not.toContain('javascript:');
    expect(resourcesHtml([])).toBe('');
  });
  it('shows the category on the card', () => {
    expect(postCard(post)).toContain('post-card__cat">Algorithms');
  });
  it('the author box names the author and links to about, contact and profiles', () => {
    const html = authorBoxHtml(post);
    expect(html).toContain('Muhammad Umer Rizwan');
    expect(html).toContain('href="/#about"');
    expect(html).toContain('href="/#contact"');
    expect(html).toContain('github.com/muhammadumera104-boop');
    expect(html).toContain('alt="Portrait of Muhammad Umer Rizwan"');
  });
  it('a guest author gets a name only, with no portrait or profile links', () => {
    const html = authorBoxHtml({ ...post, authorName: 'Guest Writer' });
    expect(html).toContain('Guest Writer');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('href="/#about"');
  });
  it('filters by category, and the search also matches subtitle and category', () => {
    const posts = [{ ...base, category: 'Systems' }, { ...base, slug: 'b', title: 'B', category: 'Security', subtitle: 'zebra' }];
    expect(filterPosts(posts, { category: 'Security' })).toHaveLength(1);
    expect(filterPosts(posts, { search: 'zebra' })).toHaveLength(1);
    expect(filterPosts(posts, { search: 'systems' })).toHaveLength(1);
    expect(filterPosts(posts, { category: 'Nope' })).toHaveLength(0);
  });
  it('every built-in post has a subtitle, a category and verified https references, and passes the schema', () => {
    for (const p of builtInPosts) {
      expect(p.subtitle, p.slug).not.toBe('');
      expect(p.category, p.slug).not.toBe('');
      expect(p.resources.length, p.slug).toBeGreaterThan(0);
      expect(postSchema.safeParse(p).success, p.slug).toBe(true);
    }
  });
  it('withBuiltInDefaults backfills subtitle, category and resources but not over dashboard edits', () => {
    const filled = withBuiltInDefaults({ slug: builtInPosts[0].slug });
    expect(filled.subtitle).toBe(builtInPosts[0].subtitle);
    expect(filled.category).toBe('Systems');
    const edited = withBuiltInDefaults({ slug: builtInPosts[0].slug, category: 'Mine', resources: [] });
    expect(edited.category).toBe('Mine');
    expect(edited.resources).toEqual([]);
  });
  it('the schema rejects non-https reference links', () => {
    const ok = (resources) => postSchema.safeParse({ ...builtInPosts[0], resources }).success;
    expect(ok([{ url: 'https://example.org/a', title: 'A' }])).toBe(true);
    expect(ok(['https://example.org/a'])).toBe(true);
    expect(ok([{ url: 'http://example.org/a' }])).toBe(false);
    expect(ok([{ url: 'javascript:alert(1)' }])).toBe(false);
  });
});
