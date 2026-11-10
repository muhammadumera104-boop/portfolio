// Email for the contact flow, sent over SMTP (Gmail by default, using an app password).
//  * a visitor's message is forwarded to the owner, with Reply-To set to the visitor
//  * the owner's reply from the admin dashboard goes to the visitor, with Reply-To set to the owner
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { HttpError } from './http.js';

export const escapeHtml = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/** Header values must be one line, or user input could inject extra mail headers. */
export const oneLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

const quote = (text) => String(text).split(/\r?\n/).map((line) => `> ${line}`).join('\n');

export const replySchema = z.object({
  to: z.string().trim().pipe(z.email()).pipe(z.string().max(120)),
  name: z.string().trim().max(80).default(''),
  subject: z.string().trim().max(150).default(''),
  message: z.string().trim().min(2).max(8000),
  original: z.string().trim().max(4000).default(''),
});

/** SMTP settings from the environment, or a clear 503 saying what is missing. */
export function mailConfig(env = process.env) {
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  if (!user || !pass) {
    throw new HttpError(503, 'Email is not set up yet. Add SMTP_USER and SMTP_PASS (a Gmail app password) in the Vercel project settings.');
  }
  return {
    user,
    pass: pass.replace(/\s+/g, ''), // Google shows app passwords in groups of four
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(env.SMTP_PORT || 465),
    secure: (env.SMTP_SECURE ?? 'true') !== 'false',
    fromName: env.MAIL_FROM_NAME || 'Muhammad Umer Rizwan',
    owner: env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL || user,
  };
}

export async function sendMail(options, env = process.env) {
  const { user, pass, host, port, secure, fromName } = mailConfig(env);
  const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  await transport.sendMail({ from: { name: fromName, address: user }, ...options });
}

const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * The portfolio's branded email frame (ink header, vermilion rule, paper background), table-based with inline
 * styles so it renders in Gmail, Outlook and phones. `bodyHtml` must already be escaped.
 */
export function brandedEmail({ heading, bodyHtml, footer = '', siteUrl = '' }) {
  const home = siteUrl ? `<a href="${escapeHtml(siteUrl)}" style="color:#888;text-decoration:underline">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>` : '';
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f4f1ea">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;font-family:${FONT};color:#111111">
<tr><td style="background:#111111;padding:20px 28px;font-size:20px;font-weight:700;color:#f4f1ea">M<span style="color:#f0442e">.</span>Umer</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:#f0442e">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 8px;font-size:22px;line-height:1.3;font-weight:600">${escapeHtml(heading)}</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#faf8f4;border-top:1px solid #eee;font-size:13px;line-height:1.5;color:#777">${footer}${footer && home ? '<br>' : ''}${home}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Mail to the owner about a new message from the contact form. */
export function buildOwnerNotice({ name, email, subject, message }, { owner, siteUrl }) {
  const title = oneLine(subject) || 'New message';
  const adminUrl = `${siteUrl}/admin.html`;
  return {
    to: owner,
    replyTo: { name: oneLine(name).replaceAll('"', ''), address: email },
    subject: `[Portfolio] ${title} — ${oneLine(name)}`.slice(0, 200),
    text: `${name} <${email}> wrote on your portfolio:\n\n${message}\n\n—\nHit reply to answer by email, or reply from the dashboard: ${adminUrl}\n`,
    html: brandedEmail({
      heading: title,
      siteUrl,
      bodyHtml: `<p style="margin:0 0 16px"><strong>${escapeHtml(name)}</strong> &lt;<a href="mailto:${escapeHtml(email)}" style="color:#c2341f">${escapeHtml(email)}</a>&gt; wrote on your portfolio:</p>
<div style="margin:0 0 16px;padding:4px 0 4px 14px;border-left:4px solid #f0442e;white-space:pre-wrap">${escapeHtml(message)}</div>
<p style="margin:0"><a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent(`Re: ${title}`)}" style="display:inline-block;background:#111111;color:#f4f1ea;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600">Reply by email</a>
&nbsp; <a href="${escapeHtml(adminUrl)}" style="color:#c2341f">or reply from the dashboard</a></p>`,
      footer: 'You are receiving this because someone used the contact form on your portfolio.',
    }),
  };
}

/** Mail from the owner to a visitor (the reply written in the admin dashboard). */
export function buildReply({ to, name, subject, message, original }, { owner, siteUrl = '' }) {
  const greeting = name ? `Hi ${oneLine(name)},` : 'Hi,';
  const clean = oneLine(subject) || 'your message';
  return {
    to: name ? { name: oneLine(name).replaceAll('"', ''), address: to } : to,
    replyTo: owner,
    subject: /^re:/i.test(clean) ? clean : `Re: ${clean}`,
    text: `${greeting}\n\n${message}\n\nBest regards,\nMuhammad Umer Rizwan${original ? `\n\nOn your message:\n${quote(original)}` : ''}\n`,
    html: brandedEmail({
      heading: clean,
      siteUrl,
      bodyHtml: `<p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
<div style="margin:0 0 20px;white-space:pre-wrap">${escapeHtml(message)}</div>
<p style="margin:0">Best regards,<br><strong>Muhammad Umer Rizwan</strong></p>${original ? `<div style="margin:24px 0 0;padding:4px 0 4px 14px;border-left:4px solid #ddd;color:#777;font-size:14px;white-space:pre-wrap"><span style="font-size:12px;text-transform:uppercase;letter-spacing:.05em">Your message</span><br>${escapeHtml(original)}</div>` : ''}`,
      footer: 'You can reply directly to this email.',
    }),
  };
}
