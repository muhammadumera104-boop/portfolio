// POST /api/notify { name, email, subject, message }
// Called by the contact form. Does two independent things and reports each one honestly:
//   saved:  the message is stored in the Firestore inbox (the admin "Messages" tab)
//   ok:     an email copy was sent to the owner
// The owner notice always goes to the owner. The visitor also gets a short, fixed confirmation (nothing they typed is
// copied into it), only for a message that really arrived, and at most twice an hour per address.
import { HttpError, assertSameSite, clientIp, handle, jsonBody, rateLimit } from './_lib/http.js';
import { buildConfirmation, buildOwnerNotice, mailConfig, sendMail, shouldConfirm } from './_lib/mail.js';
import { saveToInbox } from './_lib/inbox.js';
import { resolveSiteUrl } from '../build/seo.js';
import { contactSchema } from '../src/shared/schemas.js';

export default handle(async (req) => {
  const siteUrl = resolveSiteUrl(process.env);
  assertSameSite(req, siteUrl);
  const data = jsonBody(req);
  if (data.website) return { ok: true, saved: true }; // honeypot: bots fill the hidden field, so pretend it worked
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) throw new HttpError(400, 'Please check your name, email address and message.');
  rateLimit(`notify:${clientIp(req)}`, { max: 5, windowMs: 60 * 60 * 1000 });

  // Save to the dashboard inbox and send the email in parallel; one failing never hides the other.
  const [saved, emailed] = await Promise.all([
    saveToInbox(process.env.VITE_FIREBASE_PROJECT_ID, parsed.data),
    (async () => {
      let config;
      try {
        config = mailConfig();
      } catch (error) {
        if (error instanceof HttpError && error.status === 503) return false; // email not set up yet
        throw error;
      }
      try {
        await sendMail(buildOwnerNotice(parsed.data, { owner: config.owner, siteUrl }));
        return true;
      } catch (error) {
        console.error('[notify] email', error.message);
        return false;
      }
    })(),
  ]);

  // The automatic confirmation to the visitor. It never changes the outcome above: if it fails, the message still arrived.
  let confirmed = false;
  if (saved || emailed) {
    try {
      const config = mailConfig();
      if (shouldConfirm(parsed.data.email, { owner: config.owner, user: config.user })) {
        rateLimit(`confirm:${parsed.data.email.toLowerCase()}`, { max: 2, windowMs: 60 * 60 * 1000 });
        await sendMail(buildConfirmation({ to: parsed.data.email }, { owner: config.owner, siteUrl }));
        confirmed = true;
      }
    } catch (error) {
      if (!(error instanceof HttpError)) console.error('[notify] confirmation', error.message); // 429 / 503: skipped quietly
    }
  }
  return { ok: emailed, saved, confirmed };
});
