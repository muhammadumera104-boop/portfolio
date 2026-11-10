// Saves a contact-form message into the Firestore inbox (the admin "Messages" tab) from the server.
// This is one plain HTTPS call, so a message can no longer reach the owner's email while missing from the
// dashboard because the visitor's browser was slow to open its Firestore connection. It writes through the
// same public REST API and the same security rules as the browser does: no credentials, and the rules still check
// every field (sizes, email shape, read:false, createdAt == request time).
import { randomBytes } from 'node:crypto';

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** A 20-character document id like the ones Firestore generates. */
export const newDocId = () => Array.from(randomBytes(20), (b) => ID_CHARS[b % ID_CHARS.length]).join('');

/** The body of a Firestore REST "commit" that creates one contact_messages document. */
export function buildInboxCommit(projectId, { name, email, subject = '', message }, id = newDocId()) {
  const text = (value) => ({ stringValue: String(value) });
  return {
    writes: [
      {
        update: {
          name: `projects/${projectId}/databases/(default)/documents/contact_messages/${id}`,
          fields: { name: text(name), email: text(email), subject: text(subject), message: text(message), read: { booleanValue: false } },
        },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ],
  };
}

/** @returns {Promise<boolean>} true only when Firestore confirmed the write */
export async function saveToInbox(projectId, data, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  if (!projectId) return false;
  try {
    const response = await fetchImpl(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify(buildInboxCommit(projectId, data)),
    });
    if (!response.ok) console.error('[inbox] Firestore answered', response.status);
    return response.ok;
  } catch (error) {
    console.error('[inbox]', error.message);
    return false;
  }
}
