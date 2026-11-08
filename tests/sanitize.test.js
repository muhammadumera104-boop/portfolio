// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { cleanPostHtml, looksLikeYoutubeUrl, YOUTUBE_EMBED } from '../src/shared/sanitize.js';

const yt = (src) => `<div data-youtube-video=""><iframe src="${src}" width="640" height="360"></iframe></div>`;
const GOOD = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?controls=1&rel=0';

describe('cleanPostHtml: YouTube embeds', () => {
  it('keeps a youtube-nocookie embed and adds safe iframe attributes', () => {
    const out = cleanPostHtml(yt(GOOD));
    expect(out).toContain('<iframe');
    expect(out).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(out).toContain('allowfullscreen');
  });

  it('also allows the normal youtube.com embed address', () => {
    expect(cleanPostHtml(yt('https://www.youtube.com/embed/dQw4w9WgXcQ'))).toContain('<iframe');
  });

  it.each([
    ['another site', 'https://evil.example/embed/dQw4w9WgXcQ'],
    ['a lookalike domain', 'https://www.youtube.com.evil.example/embed/dQw4w9WgXcQ'],
    ['plain http', 'http://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['a watch page instead of an embed', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['a javascript: address', 'javascript:alert(1)'],
    ['a data: address', 'data:text/html,<script>alert(1)</script>'],
    ['a wrong-length video id', 'https://www.youtube-nocookie.com/embed/short'],
  ])('removes an iframe pointing to %s', (_name, src) => {
    expect(cleanPostHtml(`<p>before</p>${yt(src)}<p>after</p>`)).not.toContain('<iframe');
  });

  it('keeps the surrounding text when it removes a bad iframe', () => {
    const out = cleanPostHtml(`<p>before</p>${yt('https://evil.example/x')}<p>after</p>`);
    expect(out).toContain('before');
    expect(out).toContain('after');
  });
});

describe('cleanPostHtml: everything else', () => {
  it('removes scripts, inline handlers and javascript: links', () => {
    const out = cleanPostHtml('<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/<script|onclick|onerror|javascript:/i);
    expect(out).toContain('hi');
  });

  it('removes forms, form controls, objects, embeds and page styling', () => {
    const out = cleanPostHtml('<form action="/x"><input name="p"><button>Go</button></form><object data="x"></object><embed src="x"><style>body{display:none}</style><p style="position:fixed">hi</p>');
    expect(out).not.toMatch(/<form|<input|<button|<object|<embed|<style|style=/i);
    expect(out).toContain('hi');
  });

  it('keeps ordinary formatting and opens links safely in a new tab', () => {
    const out = cleanPostHtml('<h2>Title</h2><p><strong>bold</strong> <a href="https://example.com">link</a></p><pre><code>x = 1</code></pre>');
    expect(out).toContain('<h2>Title</h2>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<pre><code>x = 1</code></pre>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('noopener noreferrer');
  });
});

describe('looksLikeYoutubeUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'youtube.com/shorts/dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  ])('accepts %s', (url) => expect(looksLikeYoutubeUrl(url)).toBe(true));

  it.each(['https://vimeo.com/123', 'not a link', 'https://youtube.com.evil.example/watch?v=x', ''])('rejects %j', (url) =>
    expect(looksLikeYoutubeUrl(url)).toBe(false),
  );

  it('exports a strict embed pattern', () => {
    expect(YOUTUBE_EMBED.test(GOOD)).toBe(true);
    expect(YOUTUBE_EMBED.test('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ/../../x')).toBe(false);
  });
});
