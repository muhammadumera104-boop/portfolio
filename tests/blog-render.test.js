import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { postCard, thumbnailOf, videoGuidesHtml, articleHtml, blogPageHtml } from '../src/render/blog.js';
import { builtInPosts, withBuiltInMedia } from '../src/data/posts.js';
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
  it('withBuiltInMedia fills a missing thumbnail and videos for seeded posts, but never overrides the dashboard', () => {
    const seeded = { slug: builtInPosts[0].slug, coverImage: '' };
    const filled = withBuiltInMedia(seeded);
    expect(filled.coverImage).toBe(builtInPosts[0].coverImage);
    expect(filled.videos).toEqual(builtInPosts[0].videos);

    const edited = withBuiltInMedia({ slug: builtInPosts[0].slug, coverImage: 'https://res.cloudinary.com/x/image/upload/a.jpg', videos: [] });
    expect(edited.coverImage).toContain('cloudinary');
    expect(edited.videos).toEqual([]);

    const custom = { slug: 'my-own-post', coverImage: '' };
    expect(withBuiltInMedia(custom)).toBe(custom);
  });
  it('the schema accepts videos as strings (older data) or objects and rejects other links', () => {
    const ok = (videos) => postSchema.safeParse({ ...builtInPosts[0], videos }).success;
    expect(ok([YT, { url: 'https://vimeo.com/123456789', title: 'x' }])).toBe(true);
    expect(ok(['https://evil.example/x'])).toBe(false);
    expect(ok(['javascript:alert(1)'])).toBe(false);
    expect(ok(Array.from({ length: 7 }, (_, i) => `https://vimeo.com/12345678${i}`))).toBe(false);
  });
});
