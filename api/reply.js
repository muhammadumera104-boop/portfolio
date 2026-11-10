// POST /api/reply { to, name, subject, message, original }
// Owner only: emails a reply to a visitor who used the contact form. Their answer comes back to the owner's
// own inbox through Reply-To. The request must carry the owner's Firebase ID token.
import { HttpError, handle, jsonBody } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { buildReply, mailConfig, replySchema, sendMail } from './_lib/mail.js';
import { resolveSiteUrl } from '../build/seo.js';

export default handle(async (req) => {
  await requireAdmin(req);
  const parsed = replySchema.safeParse(jsonBody(req));
  if (!parsed.success) throw new HttpError(400, 'Please check the visitor email address and write a reply first.');
  const { owner } = mailConfig();
  try {
    await sendMail(buildReply(parsed.data, { owner, siteUrl: resolveSiteUrl(process.env) }));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('[reply]', error.message);
    throw new HttpError(502, 'The email server refused the message. Check SMTP_USER and SMTP_PASS.');
  }
  return { ok: true };
});
