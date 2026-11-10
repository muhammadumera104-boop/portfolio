// Admin check for the functions: the browser sends its Firebase ID token and we verify it against
// Google's public keys (no admin SDK or service account needed). Only the verified owner email passes,
// the same rule firestore.rules uses.
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './http.js';

const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export const bearerToken = (req) => String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();

/** Verifies a Firebase ID token and that it belongs to the verified admin email. Returns the token claims. */
export async function verifyAdminToken(token, { projectId, adminEmail, keys = GOOGLE_KEYS }) {
  if (!projectId || !adminEmail) throw new HttpError(503, 'The server is missing VITE_FIREBASE_PROJECT_ID or ADMIN_EMAIL.');
  if (!token) throw new HttpError(401, 'Please sign in again.');
  let payload;
  try {
    ({ payload } = await jwtVerify(token, keys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    }));
  } catch {
    throw new HttpError(401, 'Your sign-in has expired. Please sign in again.');
  }
  if (payload.email_verified !== true || String(payload.email || '').toLowerCase() !== adminEmail.toLowerCase()) {
    throw new HttpError(403, 'Only the site owner can do this.');
  }
  return payload;
}

export const requireAdmin = (req, env = process.env) =>
  verifyAdminToken(bearerToken(req), {
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    adminEmail: env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL,
  });
