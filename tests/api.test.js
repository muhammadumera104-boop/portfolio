import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { verifyAdminToken, bearerToken } from '../api/_lib/auth.js';
import { HttpError, assertSameSite, rateLimit, handle, jsonBody } from '../api/_lib/http.js';
import { buildOwnerNotice, buildReply, escapeHtml, mailConfig, oneLine, replySchema } from '../api/_lib/mail.js';

const PROJECT = 'demo-project';
const ADMIN = 'owner@example.com';

describe('verifyAdminToken', () => {
  let privateKey;
  let keys;

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' }] });
  });

  const sign = ({ email = ADMIN, verified = true, aud = PROJECT, iss = `https://securetoken.google.com/${PROJECT}`, exp = '10m' } = {}) =>
    new SignJWT({ email, email_verified: verified })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(iss)
      .setAudience(aud)
      .setSubject('uid')
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(privateKey);

  const check = (token) => verifyAdminToken(token, { projectId: PROJECT, adminEmail: ADMIN, keys });

  it('accepts a valid token for the verified owner (case-insensitive email)', async () => {
    const claims = await check(await sign({ email: 'Owner@Example.com' }));
    expect(claims.email_verified).toBe(true);
  });
  it('rejects a missing token with 401', async () => {
    await expect(check('')).rejects.toMatchObject({ status: 401 });
  });
  it('rejects garbage and tokens signed by someone else with 401', async () => {
    await expect(check('not.a.jwt')).rejects.toMatchObject({ status: 401 });
    const other = await generateKeyPair('RS256');
    const forged = await new SignJWT({ email: ADMIN, email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer(`https://securetoken.google.com/${PROJECT}`).setAudience(PROJECT).setExpirationTime('10m').sign(other.privateKey);
    await expect(check(forged)).rejects.toMatchObject({ status: 401 });
  });
  it('rejects a token for another Firebase project or issuer with 401', async () => {
    await expect(check(await sign({ aud: 'other-project' }))).rejects.toMatchObject({ status: 401 });
    await expect(check(await sign({ iss: 'https://securetoken.google.com/other-project' }))).rejects.toMatchObject({ status: 401 });
  });
  it('rejects an expired token with 401', async () => {
    await expect(check(await sign({ exp: Math.floor(Date.now() / 1000) - 60 }))).rejects.toMatchObject({ status: 401 });
  });
  it('rejects another account or an unverified email with 403', async () => {
    await expect(check(await sign({ email: 'visitor@example.com' }))).rejects.toMatchObject({ status: 403 });
    await expect(check(await sign({ verified: false }))).rejects.toMatchObject({ status: 403 });
  });
  it('reports a missing server configuration with 503', async () => {
    await expect(verifyAdminToken('x', { projectId: '', adminEmail: ADMIN, keys })).rejects.toMatchObject({ status: 503 });
    await expect(verifyAdminToken('x', { projectId: PROJECT, adminEmail: '', keys })).rejects.toMatchObject({ status: 503 });
  });
  it('reads the bearer token from the Authorization header', () => {
    expect(bearerToken({ headers: { authorization: 'Bearer abc.def' } })).toBe('abc.def');
    expect(bearerToken({ headers: {} })).toBe('');
  });
});

describe('http helpers', () => {
  it('assertSameSite allows the same host, localhost and requests without Origin', () => {
    const req = (origin) => ({ headers: { host: 'site.example', ...(origin ? { origin } : {}) } });
    expect(() => assertSameSite(req(), 'https://site.example')).not.toThrow();
    expect(() => assertSameSite(req('https://site.example'), 'https://x.example')).not.toThrow(); // matches the Host header
    // behind a proxy the Host header can differ; the configured site URL is accepted too
    expect(() => assertSameSite({ headers: { host: 'internal.proxy', origin: 'https://site.example' } }, 'https://site.example')).not.toThrow();
    expect(() => assertSameSite(req('http://localhost:5173'), 'https://site.example')).not.toThrow();
  });
  it('assertSameSite rejects other sites and malformed origins with 403', () => {
    const req = (origin) => ({ headers: { host: 'site.example', origin } });
    expect(() => assertSameSite(req('https://evil.example'), 'https://site.example')).toThrow(HttpError);
    expect(() => assertSameSite(req('null'), 'https://site.example')).toThrow(/origin/i);
  });
  it('rateLimit lets max requests through, then answers 429', () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i += 1) rateLimit(key, { max: 3, windowMs: 1000 });
    expect(() => rateLimit(key, { max: 3, windowMs: 1000 })).toThrow(expect.objectContaining({ status: 429 }));
    expect(() => rateLimit(`${key}:other`, { max: 3, windowMs: 1000 })).not.toThrow();
  });
  it('jsonBody accepts objects and JSON strings and rejects bad JSON with 400', () => {
    expect(jsonBody({ body: { a: 1 } })).toEqual({ a: 1 });
    expect(jsonBody({ body: '{"a":2}' })).toEqual({ a: 2 });
    expect(jsonBody({})).toEqual({});
    expect(() => jsonBody({ body: '{oops' })).toThrow(expect.objectContaining({ status: 400 }));
  });

  const fakeRes = () => {
    const res = { headers: {}, setHeader: (k, v) => (res.headers[k] = v), status: (s) => ((res.code = s), res), json: (b) => ((res.payload = b), res) };
    return res;
  };
  it('handle returns the result as JSON, with no-store caching', async () => {
    const res = fakeRes();
    await handle(async () => ({ ok: true, n: 1 }))({ method: 'POST', headers: {} }, res);
    expect(res.code).toBe(200);
    expect(res.payload).toEqual({ ok: true, n: 1 });
    expect(res.headers['Cache-Control']).toBe('no-store');
  });
  it('handle rejects other methods with 405 and an Allow header', async () => {
    const res = fakeRes();
    await handle(async () => ({}))({ method: 'GET', headers: {} }, res);
    expect(res.code).toBe(405);
    expect(res.headers.Allow).toBe('POST');
  });
  it('handle shows HttpError messages but hides unexpected errors', async () => {
    const known = fakeRes();
    await handle(async () => { throw new HttpError(403, 'Nope.'); })({ method: 'POST', headers: {} }, known);
    expect(known.code).toBe(403);
    expect(known.payload).toEqual({ error: 'Nope.' });

    const unknown = fakeRes();
    await handle(async () => { throw new Error('secret db password in stack'); })({ method: 'POST', headers: {} }, unknown);
    expect(unknown.code).toBe(500);
    expect(JSON.stringify(unknown.payload)).not.toContain('secret');
  });
});

describe('mail', () => {
  const visitor = { name: 'Ada <b>Lovelace</b>', email: 'ada@example.com', subject: 'Hello\r\nBcc: attacker@example.com', message: 'Hi <script>alert(1)</script>\nSecond line' };

  it('escapeHtml and oneLine neutralise markup and header injection', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
    expect(oneLine('a\r\nb\nc')).toBe('a b c');
  });

  it('forwards a visitor message to the owner with Reply-To set to the visitor', () => {
    const mail = buildOwnerNotice(visitor, { owner: 'owner@example.com', siteUrl: 'https://site.example' });
    expect(mail.to).toBe('owner@example.com');
    expect(mail.replyTo).toEqual({ name: 'Ada <b>Lovelace</b>', address: 'ada@example.com' });
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.subject).toContain('Hello Bcc: attacker@example.com');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.text).toContain('Second line');
    expect(mail.html).toContain('https://site.example/admin.html');
  });

  it('builds a reply to the visitor with Reply-To set to the owner, a Re: subject and the quoted original', () => {
    const mail = buildReply({ to: 'ada@example.com', name: 'Ada', subject: 'Hello', message: 'Thanks!\nBye', original: 'First\nSecond' }, { owner: 'owner@example.com' });
    expect(mail.to).toEqual({ name: 'Ada', address: 'ada@example.com' });
    expect(mail.replyTo).toBe('owner@example.com');
    expect(mail.subject).toBe('Re: Hello');
    expect(mail.text).toContain('Hi Ada,');
    expect(mail.text).toContain('> First\n> Second');
  });
  it('does not double the Re: prefix, defaults the subject, and works without a name or original', () => {
    expect(buildReply({ to: 'a@b.co', name: '', subject: 'Re: Hi', message: 'm', original: '' }, { owner: 'o@x.co' }).subject).toBe('Re: Hi');
    const bare = buildReply({ to: 'a@b.co', name: '', subject: '', message: 'm', original: '' }, { owner: 'o@x.co' });
    expect(bare.subject).toBe('Re: your message');
    expect(bare.to).toBe('a@b.co');
    expect(bare.text).not.toContain('On your message');
  });

  it('validates replies', () => {
    expect(replySchema.safeParse({ to: 'a@b.co', message: 'hello' }).success).toBe(true);
    expect(replySchema.safeParse({ to: 'not-an-email', message: 'hello' }).success).toBe(false);
    expect(replySchema.safeParse({ to: 'a@b.co', message: 'x' }).success).toBe(false);
    expect(replySchema.safeParse({ to: 'a@b.co', message: 'x'.repeat(9000) }).success).toBe(false);
  });

  it('mailConfig explains what is missing and strips the spaces Google puts in app passwords', () => {
    expect(() => mailConfig({})).toThrow(/SMTP_USER and SMTP_PASS/);
    expect(() => mailConfig({ SMTP_USER: 'u@gmail.com' })).toThrow(expect.objectContaining({ status: 503 }));
    const config = mailConfig({ SMTP_USER: 'u@gmail.com', SMTP_PASS: 'abcd efgh ijkl mnop', VITE_ADMIN_EMAIL: 'owner@example.com' });
    expect(config).toMatchObject({ host: 'smtp.gmail.com', port: 465, secure: true, pass: 'abcdefghijklmnop', owner: 'owner@example.com' });
    expect(mailConfig({ SMTP_USER: 'u@gmail.com', SMTP_PASS: 'p' }).owner).toBe('u@gmail.com');
  });
});
