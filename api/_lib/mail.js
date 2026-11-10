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

/** Mail to the owner about a new message from the contact form. */
export function buildOwnerNotice({ name, email, subject, message }, { owner, siteUrl }) {
  const title = oneLine(subject) || 'New message';
  const adminUrl = `${siteUrl}/admin.html`;
  return {
    to: owner,
    replyTo: { name: oneLine(name).replaceAll('"', ''), address: email },
    subject: `[Portfolio] ${title} — ${oneLine(name)}`.slice(0, 200),
    text: `${name} <${email}> wrote on your portfolio:\n\n${message}\n\n—\nHit reply to answer by email, or reply from the dashboard: ${adminUrl}\n`,
    html: `<p><strong>${escapeHtml(name)}</strong> &lt;<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>&gt; wrote on your portfolio:</p>
<blockquote style="margin:0;padding:0 0 0 12px;border-left:3px solid #f0442e;white-space:pre-wrap">${escapeHtml(message)}</blockquote>
<p style="color:#666">Hit reply to answer by email, or <a href="${escapeHtml(adminUrl)}">reply from the dashboard</a>.</p>`,
  };
}

/** Mail from the owner to a visitor (the reply written in the admin dashboard). */
export function buildReply({ to, name, subject, message, original }, { owner }) {
  const greeting = name ? `Hi ${oneLine(name)},` : 'Hi,';
  const clean = oneLine(subject) || 'your message';
  return {
    to: name ? { name: oneLine(name).replaceAll('"', ''), address: to } : to,
    replyTo: owner,
    subject: /^re:/i.test(clean) ? clean : `Re: ${clean}`,
    text: `${greeting}\n\n${message}\n\nBest regards,\nMuhammad Umer Rizwan${original ? `\n\nOn your message:\n${quote(original)}` : ''}\n`,
    html: `<p>${escapeHtml(greeting)}</p>
<div style="white-space:pre-wrap">${escapeHtml(message)}</div>
<p>Best regards,<br>Muhammad Umer Rizwan</p>${original ? `<blockquote style="margin:16px 0 0;padding:0 0 0 12px;border-left:3px solid #ccc;color:#666;white-space:pre-wrap">${escapeHtml(original)}</blockquote>` : ''}`,
  };
}
