// Cloudinary helpers. Everything here is safe for the browser: the API *secret* never appears in the
// site. Uploads are signed by /api/cloudinary-sign (a Vercel function that checks the admin login);
// this file only builds delivery URLs and performs the signed upload.

const DELIVERY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

export const isCloudinaryUrl = (url) => DELIVERY.test(String(url ?? ''));

/**
 * Adds automatic format/quality (and an optional size) to a Cloudinary image URL, so visitors get
 * a small WebP/AVIF instead of the original. Other URLs are returned untouched.
 */
export function optimizeImage(url, { width, height, crop = 'fill' } = {}) {
  const match = DELIVERY.exec(String(url ?? ''));
  if (!match) return url;
  const [, head, rest] = match;
  if (/^(?:[a-z]{1,3}_[^/]+,?)+\//.test(rest)) return url; // already carries a transformation
  const parts = [];
  if (width && height) parts.push(`c_${crop}`, 'g_auto', `w_${Math.round(width)}`, `h_${Math.round(height)}`);
  else if (width) parts.push('c_limit', `w_${Math.round(width)}`);
  parts.push('q_auto', 'f_auto');
  return `${head}${parts.join(',')}/${rest}`;
}

/** A srcset string of the same Cloudinary image at several widths (16:9 when `ratio` is given). */
export function imageSrcset(url, widths, ratio) {
  if (!isCloudinaryUrl(url)) return '';
  return widths.map((w) => `${optimizeImage(url, { width: w, height: ratio ? w / ratio : undefined })} ${w}w`).join(', ');
}

/**
 * Uploads a file with parameters signed by the server.
 * @param {File} file
 * @param {{cloudName: string, apiKey: string, timestamp: number, signature: string, folder: string}} signed
 * @param {'image'|'video'} resourceType
 * @returns {Promise<string>} the https URL of the uploaded file
 */
export async function uploadToCloudinary(file, signed, resourceType = 'image', fetchImpl = fetch) {
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signed.apiKey);
  body.append('timestamp', String(signed.timestamp));
  body.append('signature', signed.signature);
  body.append('folder', signed.folder);
  const response = await fetchImpl(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/${resourceType}/upload`, {
    method: 'POST',
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || `Cloudinary upload failed (${response.status}).`);
  }
  return data.secure_url;
}
