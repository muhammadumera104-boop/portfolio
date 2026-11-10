// Tiny helpers shared by the Vercel functions in /api.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wraps a handler: method check, JSON response, and errors turned into { error } without leaking internals. */
export const handle =
  (fn, { methods = ['POST'] } = {}) =>
  async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));
        throw new HttpError(405, 'Method not allowed.');
      }
      const result = await fn(req);
      res.status(200).json(result ?? { ok: true });
    } catch (error) {
      if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
      console.error('[api]', error);
      return res.status(500).json({ error: 'Something went wrong on the server.' });
    }
  };

/** The parsed JSON body (Vercel parses application/json already; a string body is parsed here). */
export function jsonBody(req) {
  const raw = req.body;
  if (raw && typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw new HttpError(400, 'The request body is not valid JSON.');
  }
}

/**
 * Browsers always send Origin on cross-site POSTs. Reject those that do not come from this site
 * (requests without Origin, e.g. from scripts, are limited by the rate limit and validation instead).
 */
export function assertSameSite(req, siteUrl) {
  const origin = req.headers.origin;
  if (!origin) return;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'Bad origin.');
  }
  const allowed = new Set([req.headers.host, safeHost(siteUrl)].filter(Boolean));
  if (!allowed.has(host) && !/^localhost(:\d+)?$/.test(host)) throw new HttpError(403, 'Requests from other sites are not accepted.');
}

const safeHost = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
};

const hits = new Map();

/** Best-effort per-instance limiter (serverless instances do not share memory, so this only slows bursts). */
export function rateLimit(key, { max, windowMs }) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) throw new HttpError(429, 'Too many requests. Please try again later.');
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
}

export const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
