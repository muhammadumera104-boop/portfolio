import { describe, it, expect } from 'vitest';
import {
  thumbnail, videoInfo, parseVideoLines, formatVideoLines, normalizeVideos, youtubeId, youtubeThumb,
} from '../src/shared/media.js';

describe('thumbnail', () => {
  it('adds a crop and auto-format transform to Cloudinary images', () => {
    expect(thumbnail('https://res.cloudinary.com/demo/image/upload/v1/blog/a.jpg')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_600,h_340,q_auto,f_auto/v1/blog/a.jpg',
    );
  });
  it('leaves other URLs and empty values alone', () => {
    expect(thumbnail('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
    expect(thumbnail('')).toBe('');
    expect(thumbnail(undefined)).toBe('');
  });
});

describe('youtubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=-L-WgKMFuhE', '-L-WgKMFuhE'],
  ])('reads the id from %s', (link, id) => expect(youtubeId(link)).toBe(id));

  it.each([
    'https://www.youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://evil.example/?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch',
    'javascript:alert(1)',
    'dQw4w9WgXcQ',
    '',
    null,
  ])('returns null for %s', (link) => expect(youtubeId(link)).toBeNull());
});

describe('videoInfo', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
  ])('recognises the YouTube link %s', (link) => {
    const info = videoInfo(link);
    expect(info.provider).toBe('youtube');
    expect(info.thumb).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(info.href).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(info.embed).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&autoplay=1');
  });
  it('recognises Vimeo and plain video files', () => {
    expect(videoInfo('https://vimeo.com/123456789')).toMatchObject({ provider: 'vimeo', embed: 'https://player.vimeo.com/video/123456789?autoplay=1' });
    expect(videoInfo('https://cdn.example.com/clip.mp4')).toMatchObject({ provider: 'file', src: 'https://cdn.example.com/clip.mp4' });
  });
  it('builds a poster frame for Cloudinary videos', () => {
    const info = videoInfo('https://res.cloudinary.com/demo/video/upload/v1/portfolio/videos/clip.mp4');
    expect(info.thumb).toBe('https://res.cloudinary.com/demo/video/upload/so_0,c_fill,w_600,h_340,q_auto,f_jpg/v1/portfolio/videos/clip.jpg');
  });
  it.each(['javascript:alert(1)', 'https://evil.example/page', 'data:text/html,x', 'http://evil.example/clip.mp4', '', null])('rejects %s', (link) => {
    expect(videoInfo(link)).toBeNull();
  });
});

describe('video lists', () => {
  it('parseVideoLines reads "link | title" lines without validating them', () => {
    expect(parseVideoLines(' https://youtu.be/dQw4w9WgXcQ | Intro \n\nnot a link\r\nhttps://vimeo.com/123456789')).toEqual([
      { url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Intro' },
      { url: 'not a link', title: '' },
      { url: 'https://vimeo.com/123456789', title: '' },
    ]);
  });
  it('keeps a | inside a title', () => {
    expect(parseVideoLines('https://youtu.be/dQw4w9WgXcQ | A | B')[0].title).toBe('A | B');
  });
  it('normalizeVideos accepts strings and objects, drops invalid links and duplicates, canonicalises urls', () => {
    const out = normalizeVideos([
      'https://youtu.be/dQw4w9WgXcQ',
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'duplicate' },
      { url: 'https://evil.example/x', title: 'bad' },
      { url: 'https://vimeo.com/123456789', title: '  Vimeo one  ' },
      null,
    ]);
    expect(out.map((v) => v.url)).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://vimeo.com/123456789']);
    expect(out[1].title).toBe('Vimeo one');
  });
  it('normalizeVideos tolerates non-arrays', () => {
    expect(normalizeVideos(undefined)).toEqual([]);
    expect(normalizeVideos('https://youtu.be/dQw4w9WgXcQ')).toEqual([]);
  });
  it('formatVideoLines is the inverse of parseVideoLines for the form', () => {
    const videos = [{ url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Intro' }, 'https://vimeo.com/123456789'];
    expect(formatVideoLines(videos)).toBe('https://youtu.be/dQw4w9WgXcQ | Intro\nhttps://vimeo.com/123456789');
    expect(formatVideoLines(undefined)).toBe('');
  });
  it('youtubeThumb points at the YouTube image host', () => {
    expect(youtubeThumb('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });
});
