import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { optimizeImage, imageSrcset, isCloudinaryUrl, uploadToCloudinary } from '../src/shared/cloudinary.js';
import { signParams, createUploadSignature } from '../api/_lib/cloudinary.js';

const IMG = 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/blog/a.jpg';

describe('optimizeImage', () => {
  it('adds auto format and quality only', () => {
    expect(optimizeImage(IMG)).toBe('https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/v1/portfolio/blog/a.jpg');
  });
  it('limits the width when only a width is given', () => {
    expect(optimizeImage(IMG, { width: 640 })).toContain('/upload/c_limit,w_640,q_auto,f_auto/');
  });
  it('crops to a fixed size when width and height are given', () => {
    expect(optimizeImage(IMG, { width: 1200, height: 630 })).toContain('/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_auto/');
  });
  it('does not transform an image twice', () => {
    const done = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_300/v1/a.jpg';
    expect(optimizeImage(done, { width: 640 })).toBe(done);
  });
  it('leaves other URLs and empty values untouched', () => {
    expect(optimizeImage('https://example.com/a.jpg', { width: 300 })).toBe('https://example.com/a.jpg');
    expect(optimizeImage('images/blog/a.jpg')).toBe('images/blog/a.jpg');
    expect(optimizeImage(undefined)).toBeUndefined();
  });
  it('does not treat other hosts that mention cloudinary as Cloudinary', () => {
    expect(isCloudinaryUrl('https://evil.example/res.cloudinary.com/x/image/upload/a.jpg')).toBe(false);
    expect(isCloudinaryUrl(IMG)).toBe(true);
  });
});

describe('imageSrcset', () => {
  it('lists each width for a Cloudinary image', () => {
    const set = imageSrcset(IMG, [400, 800], 16 / 9);
    expect(set).toContain('w_400,h_225');
    expect(set).toContain(' 400w, ');
    expect(set).toContain(' 800w');
  });
  it('is empty for other images', () => {
    expect(imageSrcset('images/blog/a.jpg', [400, 800])).toBe('');
  });
});

describe('uploadToCloudinary', () => {
  const signed = { cloudName: 'demo cloud', apiKey: '123', timestamp: 1700000000, signature: 'abc', folder: 'portfolio/blog' };

  it('posts the signed fields to the right endpoint and returns the secure URL', async () => {
    let seen;
    const fetchImpl = async (url, init) => {
      seen = { url, body: init.body };
      return { ok: true, status: 200, json: async () => ({ secure_url: IMG }) };
    };
    const file = new Blob(['x'], { type: 'image/png' });
    expect(await uploadToCloudinary(file, signed, 'image', fetchImpl)).toBe(IMG);
    expect(seen.url).toBe('https://api.cloudinary.com/v1_1/demo%20cloud/image/upload');
    expect(seen.body.get('signature')).toBe('abc');
    expect(seen.body.get('timestamp')).toBe('1700000000');
    expect(seen.body.get('api_key')).toBe('123');
    expect(seen.body.get('folder')).toBe('portfolio/blog');
    expect(seen.body.get('file')).toBeInstanceOf(Blob);
  });

  it('uses the video endpoint for videos', async () => {
    let url;
    const fetchImpl = async (u) => {
      url = u;
      return { ok: true, status: 200, json: async () => ({ secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/a.mp4' }) };
    };
    await uploadToCloudinary(new Blob(['x']), signed, 'video', fetchImpl);
    expect(url).toContain('/video/upload');
  });

  it('surfaces the error message from Cloudinary', async () => {
    const fetchImpl = async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'Invalid Signature' } }) });
    await expect(uploadToCloudinary(new Blob(['x']), signed, 'image', fetchImpl)).rejects.toThrow('Invalid Signature');
  });
});

describe('signParams (server)', () => {
  it('signs sorted key=value pairs followed by the secret with SHA-1', () => {
    const expected = createHash('sha1').update('folder=portfolio/blog&timestamp=1700000000SECRET').digest('hex');
    expect(signParams({ timestamp: 1700000000, folder: 'portfolio/blog' }, 'SECRET')).toBe(expected);
  });
  it('skips empty values', () => {
    expect(signParams({ a: '', b: 1 }, 's')).toBe(signParams({ b: 1 }, 's'));
  });
});

describe('createUploadSignature', () => {
  const env = { CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: '123456789012345', CLOUDINARY_API_SECRET: 'topsecret' };

  it('returns a signature for the folder and timestamp, and never the secret', () => {
    const out = createUploadSignature({ folder: 'portfolio/blog', env, now: 1_700_000_123_456 });
    expect(out).toEqual({
      cloudName: 'demo',
      apiKey: '123456789012345',
      timestamp: 1_700_000_123,
      folder: 'portfolio/blog',
      signature: signParams({ folder: 'portfolio/blog', timestamp: 1_700_000_123 }, 'topsecret'),
    });
    expect(JSON.stringify(out)).not.toContain('topsecret');
  });
  it('explains what is missing when Cloudinary is not configured', () => {
    expect(() => createUploadSignature({ env: { CLOUDINARY_API_KEY: '1', CLOUDINARY_API_SECRET: 's' } })).toThrow(/CLOUDINARY_CLOUD_NAME/);
  });
  it.each(['../etc', 'a b', '', '/root', 'x'.repeat(60), 'a;b'])('rejects the folder %j', (folder) => {
    expect(() => createUploadSignature({ folder, env })).toThrow();
  });
});
