// Cloudinary upload signing. The API secret is read from the server environment and never sent to the browser:
// the browser only receives the finished signature for one upload (folder + timestamp).
import { createHash } from 'node:crypto';
import { HttpError } from './http.js';

/** SHA-1 of "key=value&key=value…" (keys sorted, empty values skipped) followed by the secret. */
export function signParams(params, secret) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(toSign + secret).digest('hex');
}

const FOLDER = /^[a-z0-9][a-z0-9_/-]{0,39}$/i;

export function createUploadSignature({ folder = 'portfolio/blog', env = process.env, now = Date.now() }) {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret } = env;
  if (!cloudName || !apiKey || !secret) {
    throw new HttpError(503, 'Image uploads are not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel.');
  }
  if (!FOLDER.test(folder)) throw new HttpError(400, 'Invalid upload folder.');
  const timestamp = Math.floor(now / 1000);
  return { cloudName, apiKey, timestamp, folder, signature: signParams({ folder, timestamp }, secret) };
}
