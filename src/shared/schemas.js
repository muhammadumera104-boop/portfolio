// Zod schemas. The same rules validate forms in the browser; firestore.rules repeats the
// important limits on the server, so a hand-made request cannot skip them.
import { z } from 'zod';

const text = (min, max, message) =>
  z
    .string()
    .trim()
    .min(min, message || `Must be at least ${min} characters.`)
    .max(max, `Must be at most ${max} characters.`);

const email = z.string().trim().pipe(z.email('Please enter a valid email address.')).pipe(z.string().max(120));

// Empty, a full http(s) URL, or a path inside this site such as demos/app.html (no scheme, so no javascript: or data:).
const url = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\/\S+$/i.test(v) || /^[A-Za-z0-9][\w./-]*$/.test(v),
    'Must be a full http(s) URL, a path like demos/app.html, or empty.',
  );

export const slug = z
  .string()
  .trim()
  .min(2, 'Slug is too short.')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');

export const contactSchema = z.object({
  name: text(2, 80, 'Please enter your name.'),
  email,
  subject: z.string().trim().max(120).default(''),
  message: text(10, 4000, 'Please write at least 10 characters.'),
});

// No email on public comments: comments are readable by everyone, so an address would be too.
export const commentSchema = z.object({
  name: text(2, 80, 'Please enter your name.'),
  content: text(2, 1000, 'Please write a comment.'),
});

export const postSchema = z.object({
  title: text(3, 140),
  slug,
  excerpt: z.string().trim().max(300).default(''),
  content: z.string().min(1, 'Write something first.').max(200_000),
  coverImage: url.default(''),
  tags: z.array(text(1, 30)).max(8).default([]),
  published: z.boolean().default(false),
  authorName: text(2, 80).default('Muhammad Umer Rizwan'),
});

export const projectSchema = z.object({
  title: text(3, 120),
  slug,
  category: text(1, 40),
  kind: text(1, 60),
  status: text(1, 40),
  summary: text(10, 500),
  problem: z.string().trim().max(500).default(''),
  details: z.array(text(1, 300)).max(10).default([]),
  outcome: z.string().trim().max(500).default(''),
  techStack: z.array(text(1, 40)).max(12).default([]),
  imageUrl: url.default(''),
  liveUrl: url.default(''),
  githubUrl: url.default(''),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const skillSchema = z.object({
  group: text(2, 60),
  level: z.enum(['practiced', 'learning', 'exploring']),
  note: z.string().trim().max(200).default(''),
  items: z.array(text(1, 40)).min(1, 'Add at least one item.').max(12),
  displayOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const experienceSchema = z.object({
  kind: z.enum(['education', 'recognition']),
  title: text(2, 100),
  place: text(2, 120),
  period: z.string().trim().max(60).default(''),
  note: z.string().trim().max(40).default(''),
  text: z.string().trim().max(400).default(''),
  displayOrder: z.coerce.number().int().min(0).max(999).default(0),
});

/** Turns a failed safeParse into { fieldName: 'first message' }. */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
