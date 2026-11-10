// POST /api/notify { name, email, subject, message }
// Called by the contact form after the message is saved to the Firestore inbox. Emails the owner a copy.
// The recipient is always the owner's own address, so this can never be used to mail anyone else.
import { HttpError, assertSameSite, clientIp, handle, jsonBody, rateLimit } from './_lib/http.js';
import { buildOwnerNotice, mailConfig, sendMail } from './_lib/mail.js';
import { resolveSiteUrl } from '../build/seo.js';
import { contactSchema } from '../src/shared/schemas.js';

export default handle(async (req) => {
  const siteUrl = resolveSiteUrl(process.env);
  assertSameSite(req, siteUrl);
  const data = jsonBody(req);
  if (data.website) return { ok: true }; // honeypot: bots fill the hidden field, so pretend it worked
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) throw new HttpError(400, 'Please check your name, email address and message.');
  rateLimit(`notify:${clientIp(req)}`, { max: 5, windowMs: 60 * 60 * 1000 });

  let config;
  try {
    config = mailConfig();
  } catch (error) {
    // Email is not set up yet. The message is already in the inbox, so this is not an error for the visitor.
    if (error instanceof HttpError && error.status === 503) return { ok: false, skipped: true };
    throw error;
  }
  await sendMail(buildOwnerNotice(parsed.data, { owner: config.owner, siteUrl }));
  return { ok: true };
});
