import { describe, it, expect } from 'vitest';
import { describeOutcome, tooFast, MIN_FILL_MS } from '../src/shared/contact-flow.js';
import { brandedEmail, buildOwnerNotice, buildReply } from '../api/_lib/mail.js';

const OWNER = 'owner@example.com';

describe('describeOutcome: never report success that did not happen', () => {
  it('saved and emailed is a full success', () => {
    const out = describeOutcome({ saved: true, emailed: true }, OWNER);
    expect(out.kind).toBe('success');
    expect(out.message).toMatch(/sent/);
  });
  it('emailed but not saved is still a success (the owner has the message)', () => {
    expect(describeOutcome({ saved: false, emailed: true }, OWNER).kind).toBe('success');
  });
  it('saved but not emailed is only a partial success and says so', () => {
    const out = describeOutcome({ saved: true, emailed: false }, OWNER);
    expect(out.kind).toBe('partial');
    expect(out.message).toMatch(/did not go through/);
    expect(out.message).toContain(OWNER);
    expect(out.message).not.toMatch(/^Thanks — your message was sent/);
  });
  it('neither is a failure that points at the owner address', () => {
    const out = describeOutcome({ saved: false, emailed: false }, OWNER);
    expect(out.kind).toBe('failed');
    expect(out.message).toContain(OWNER);
    expect(out.toast).toMatch(/Could not/);
  });
});

describe('tooFast', () => {
  it('flags submissions made before a person could have typed a message', () => {
    expect(tooFast(1000, 1000 + MIN_FILL_MS - 1)).toBe(true);
    expect(tooFast(1000, 1000 + MIN_FILL_MS)).toBe(false);
  });
});

describe('branded emails', () => {
  it('wraps content in the portfolio frame and escapes the heading', () => {
    const html = brandedEmail({ heading: '<b>Hi</b>', bodyHtml: '<p>x</p>', footer: 'foot', siteUrl: 'https://site.example' });
    expect(html).toContain('M<span style="color:#f0442e">.</span>Umer');
    expect(html).toContain('&lt;b&gt;Hi&lt;/b&gt;');
    expect(html).toContain('<p>x</p>');
    expect(html).toContain('site.example');
  });
  it('the owner notice has a reply button and the dashboard link, with the visitor text escaped', () => {
    const mail = buildOwnerNotice({ name: 'Ada', email: 'ada@example.com', subject: 'Hi', message: '<script>x</script>' }, { owner: OWNER, siteUrl: 'https://site.example' });
    expect(mail.html).toContain('mailto:ada@example.com?subject=Re%3A%20Hi');
    expect(mail.html).toContain('https://site.example/admin.html');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('M<span');
  });
  it('the reply is branded and quotes the original message', () => {
    const mail = buildReply({ to: 'a@b.co', name: 'Ada', subject: 'Hi', message: 'Thanks', original: 'First' }, { owner: OWNER, siteUrl: 'https://site.example' });
    expect(mail.html).toContain('Best regards');
    expect(mail.html).toContain('Your message');
    expect(mail.html).toContain('First');
  });
});
