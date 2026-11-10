import { describe, it, expect } from 'vitest';
import { buildInboxCommit, newDocId, saveToInbox } from '../api/_lib/inbox.js';

const data = { name: 'Ada', email: 'ada@example.com', subject: 'Hi', message: 'Hello there, nice site!' };

describe('buildInboxCommit', () => {
  const [write] = buildInboxCommit('my-project', data, 'abc123').writes;

  it('creates one contact_messages document that must not already exist', () => {
    expect(write.update.name).toBe('projects/my-project/databases/(default)/documents/contact_messages/abc123');
    expect(write.currentDocument).toEqual({ exists: false });
  });
  it('writes exactly the fields the security rules allow, unread, with a server-side timestamp', () => {
    expect(Object.keys(write.update.fields).sort()).toEqual(['email', 'message', 'name', 'read', 'subject']);
    expect(write.update.fields.read).toEqual({ booleanValue: false });
    expect(write.update.fields.name).toEqual({ stringValue: 'Ada' });
    expect(write.updateTransforms).toEqual([{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }]);
  });
  it('defaults a missing subject to an empty string (the rules require a string)', () => {
    const [w] = buildInboxCommit('p', { name: 'Ada', email: 'a@b.co', message: 'Long enough message' }, 'x').writes;
    expect(w.update.fields.subject).toEqual({ stringValue: '' });
  });
});

describe('newDocId', () => {
  it('is 20 URL-safe characters and different each time', () => {
    const a = newDocId();
    expect(a).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(newDocId()).not.toBe(a);
  });
});

describe('saveToInbox', () => {
  it('posts the commit to the project and reports true on success', async () => {
    let seen;
    const fetchImpl = async (url, init) => {
      seen = { url, body: JSON.parse(init.body) };
      return { ok: true, status: 200 };
    };
    expect(await saveToInbox('my-project', data, { fetchImpl })).toBe(true);
    expect(seen.url).toBe('https://firestore.googleapis.com/v1/projects/my-project/databases/(default)/documents:commit');
    expect(seen.body.writes[0].update.fields.email).toEqual({ stringValue: 'ada@example.com' });
  });
  it('reports false (never throws) when Firestore refuses, the network fails, or no project is set', async () => {
    expect(await saveToInbox('p', data, { fetchImpl: async () => ({ ok: false, status: 403 }) })).toBe(false);
    expect(await saveToInbox('p', data, { fetchImpl: async () => { throw new Error('offline'); } })).toBe(false);
    expect(await saveToInbox('', data, { fetchImpl: async () => ({ ok: true }) })).toBe(false);
  });
});
