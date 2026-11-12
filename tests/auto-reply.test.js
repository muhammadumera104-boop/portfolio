import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldConfirm, buildConfirmation } from '../api/_lib/mail.js';
import { describeOutcome } from '../src/shared/contact-flow.js';
import { cv } from '../src/data/content.js';

// ── pure pieces ────────────────────────────────────────────────────────────────────────────────
describe('shouldConfirm', () => {
  const owner = { owner: 'Owner@Example.com', user: 'smtp@example.com' };

  it('says yes for an ordinary visitor address', () => {
    expect(shouldConfirm('ada@example.org', owner)).toBe(true);
    expect(shouldConfirm('  Ada.Lovelace@Gmail.com ', owner)).toBe(true);
  });
  it('never writes to the owner’s own addresses (no mail loops), whatever the capitals', () => {
    expect(shouldConfirm('owner@example.com', owner)).toBe(false);
    expect(shouldConfirm('SMTP@example.com', owner)).toBe(false);
  });
  it('skips robot addresses and values that are not addresses', () => {
    for (const bad of ['noreply@example.org', 'no-reply@example.org', 'DoNotReply@example.org', 'mailer-daemon@example.org', 'postmaster@example.org', 'nobody', '', null, undefined]) {
      expect(shouldConfirm(bad, owner), String(bad)).toBe(false);
    }
  });
  it('skips an address whose domain looks mistyped, because it would only bounce', () => {
    expect(shouldConfirm('ada@gmial.com', owner)).toBe(false);
    expect(shouldConfirm('ada@gma5l.com', owner)).toBe(false);
  });
});

describe('buildConfirmation', () => {
  const mail = buildConfirmation({ to: 'ada@example.org' }, { owner: 'owner@example.com', siteUrl: 'https://portfolio.example' });

  it('goes to the visitor, with replies going to the owner', () => {
    expect(mail.to).toBe('ada@example.org');
    expect(mail.replyTo).toBe('owner@example.com');
    expect(mail.subject).toContain('Thanks for your message');
  });
  it('is marked as automatic so out-of-office robots do not answer it', () => {
    expect(mail.headers['Auto-Submitted']).toBe('auto-replied');
    expect(mail.headers.Precedence).toBe('bulk');
    expect(mail.headers['X-Auto-Response-Suppress']).toBe('All');
  });
  it('says what happened and what comes next, with real links, and tells a stranger they can ignore it', () => {
    expect(mail.text).toContain('I have received your message');
    expect(mail.text).toContain('https://portfolio.example/#projects');
    expect(mail.text).toContain(`https://portfolio.example${cv.path}`);
    expect(mail.text).toContain('github.com/muhammadumera104-boop');
    expect(mail.text).toContain('you can ignore this email');
    expect(mail.html).toContain(`href="https://portfolio.example${cv.path}"`);
    expect(mail.html).toContain('you can ignore this email');
  });
  it('takes nothing a visitor typed, so the form cannot be used to send someone else’s words to a third person', () => {
    // buildConfirmation only receives the address; there is no field for a name, subject or message at all.
    expect(buildConfirmation.length).toBe(2);
    const text = JSON.stringify(mail);
    expect(text).not.toMatch(/undefined|\[object/);
  });
});

describe('what the visitor is told', () => {
  it('mentions the confirmation only when the server really sent one', () => {
    expect(describeOutcome({ saved: true, emailed: true, confirmed: true }, 'o@x.com').message).toContain('A confirmation email is on its way');
    expect(describeOutcome({ saved: true, emailed: true, confirmed: false }, 'o@x.com').message).not.toContain('confirmation');
    expect(describeOutcome({ saved: true, emailed: true }, 'o@x.com').message).not.toContain('confirmation');
  });
  it('never promises a confirmation when the message itself could not be sent', () => {
    expect(describeOutcome({ saved: false, emailed: false, confirmed: true }, 'o@x.com').message).not.toContain('confirmation');
  });
  it('keeps the original messages word for word when there is no confirmation', () => {
    expect(describeOutcome({ saved: true, emailed: true }, 'o@x.com').message).toBe('Thanks — your message was sent and is in my inbox. I will reply by email.');
    expect(describeOutcome({ saved: true, emailed: true }, 'o@x.com').toast).toBe('Message sent. Thank you!');
  });
});

// ── the whole endpoint, with the mail transport and the inbox replaced by fakes ─────────────────
const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), saveToInbox: vi.fn() }));

vi.mock('../api/_lib/mail.js', async (importOriginal) => ({
  ...(await importOriginal()),
  sendMail: mocks.sendMail,
  mailConfig: () => ({ user: 'smtp@example.com', owner: 'owner@example.com' }),
}));
vi.mock('../api/_lib/inbox.js', () => ({ saveToInbox: mocks.saveToInbox }));

const { default: notify } = await import('../api/notify.js');

let counter = 0;
async function post(body, { ip = `10.0.0.${++counter}` } = {}) {
  const res = {
    code: 0,
    payload: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(p) { this.payload = p; return this; },
  };
  await notify({ method: 'POST', headers: { origin: 'http://localhost:4173', 'x-forwarded-for': ip }, body }, res);
  return res;
}

const visitor = (extra = {}) => ({ name: 'Ada Lovelace', email: 'ada@example.org', subject: 'Internship', message: 'Hello, I would like to talk about an internship.', ...extra });

describe('POST /api/notify with an automatic confirmation', () => {
  beforeEach(() => {
    mocks.sendMail.mockReset().mockResolvedValue(undefined);
    mocks.saveToInbox.mockReset().mockResolvedValue(true);
  });

  it('notifies the owner and confirms to the visitor, and reports both honestly', async () => {
    const res = await post(visitor());
    expect(res.code).toBe(200);
    expect(res.payload).toEqual({ ok: true, saved: true, confirmed: true });
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
    const [first, second] = mocks.sendMail.mock.calls.map((c) => c[0]);
    expect(first.to).toBe('owner@example.com'); // the owner notice
    expect(second.to).toBe('ada@example.org'); // the confirmation
  });
  it('the confirmation carries none of the visitor’s own words', async () => {
    await post(visitor({ name: 'Mallory Evil', subject: 'Buy pills', message: 'Send money to attacker@evil.example now please.' }));
    const confirmation = mocks.sendMail.mock.calls[1][0];
    const everything = JSON.stringify(confirmation);
    for (const secret of ['Mallory', 'Buy pills', 'attacker@evil.example', 'Send money']) expect(everything).not.toContain(secret);
  });
  it('a confirmation that fails never turns a delivered message into a failure', async () => {
    mocks.sendMail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('smtp down'));
    const res = await post(visitor({ email: 'grace@example.org' }));
    expect(res.payload).toEqual({ ok: true, saved: true, confirmed: false });
  });
  it('sends no confirmation when the message did not arrive anywhere', async () => {
    mocks.saveToInbox.mockResolvedValue(false);
    mocks.sendMail.mockRejectedValue(new Error('smtp down'));
    const res = await post(visitor({ email: 'linus@example.org' }));
    expect(res.payload).toEqual({ ok: false, saved: false, confirmed: false });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1); // only the failed owner notice
  });
  it('a bot that fills the hidden field gets no mail at all, in either direction', async () => {
    const res = await post(visitor({ website: 'http://spam.example' }));
    expect(res.payload).toEqual({ ok: true, saved: true });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it('does not write back to the owner’s own address, or to a mistyped domain', async () => {
    expect((await post(visitor({ email: 'owner@example.com' }))).payload.confirmed).toBe(false);
    expect((await post(visitor({ email: 'ada@gmial.com' }))).payload.confirmed).toBe(false);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2); // two owner notices, no confirmations
  });
  it('confirms to one address at most twice an hour, even from different networks', async () => {
    const email = 'repeat@example.org';
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push((await post(visitor({ email }))).payload.confirmed);
    expect(results).toEqual([true, true, false, false]);
  });
});
