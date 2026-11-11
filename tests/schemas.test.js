import { describe, it, expect } from 'vitest';
import {
  contactSchema, commentSchema, postSchema, projectSchema, skillSchema, experienceSchema, fieldErrors,
} from '../src/shared/schemas.js';

const ok = (schema, value) => schema.safeParse(value);

describe('contactSchema', () => {
  const valid = { name: 'Ayesha Khan', email: 'ayesha@example.com', message: 'Hello, I would like to talk.' };
  it('accepts a valid message and defaults the subject', () => {
    const r = ok(contactSchema, valid);
    expect(r.success).toBe(true);
    expect(r.data.subject).toBe('');
  });
  it('trims values', () => expect(ok(contactSchema, { ...valid, name: '  Ayesha  ' }).data.name).toBe('Ayesha'));
  it('rejects a bad email with a friendly message', () => {
    const r = ok(contactSchema, { ...valid, email: 'nope' });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error).email).toMatch(/valid email/i);
  });
  it('rejects short names and messages', () => {
    const errors = fieldErrors(ok(contactSchema, { name: 'A', email: valid.email, message: 'short' }).error);
    expect(errors.name).toBeTruthy();
    expect(errors.message).toMatch(/10 characters/);
  });
  it('rejects over-long messages', () => expect(ok(contactSchema, { ...valid, message: 'x'.repeat(4001) }).success).toBe(false));
});

describe('commentSchema', () => {
  it('accepts name + content only', () => expect(ok(commentSchema, { name: 'Sam', content: 'Nice post' }).success).toBe(true));
  it('strips unknown fields such as email', () => {
    expect(ok(commentSchema, { name: 'Sam', content: 'Nice', email: 'a@b.co' }).data).toEqual({ name: 'Sam', content: 'Nice' });
  });
  it('rejects empty content', () => expect(ok(commentSchema, { name: 'Sam', content: ' ' }).success).toBe(false));
});

describe('postSchema', () => {
  const valid = { title: 'My first post', slug: 'my-first-post', content: '<p>Hi</p>' };
  it('applies defaults', () => {
    const r = ok(postSchema, valid);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ published: false, tags: [], coverImage: '', excerpt: '' });
  });
  it('rejects slugs with spaces, capitals or double hyphens', () => {
    ['My Post', 'my--post', '-start', 'UPPER'].forEach((slug) => expect(ok(postSchema, { ...valid, slug }).success).toBe(false));
  });
  it('rejects empty content', () => expect(ok(postSchema, { ...valid, content: '' }).success).toBe(false));
  it('only accepts http(s) cover images', () => {
    expect(ok(postSchema, { ...valid, coverImage: 'https://x.test/a.png' }).success).toBe(true);
    expect(ok(postSchema, { ...valid, coverImage: 'javascript:alert(1)' }).success).toBe(false);
  });
  it('caps tags at 8', () => expect(ok(postSchema, { ...valid, tags: Array.from({ length: 9 }, (_, i) => `t${i}`) }).success).toBe(false));
});

describe('projectSchema / skillSchema / experienceSchema', () => {
  const project = { title: 'EduTrack', slug: 'edutrack', category: 'C++', kind: 'C++ · OOP', status: 'Concept project', summary: 'A student records system.' };
  it('accepts a project and coerces displayOrder from a form string', () => {
    const r = ok(projectSchema, { ...project, displayOrder: '3' });
    expect(r.success).toBe(true);
    expect(r.data.displayOrder).toBe(3);
  });
  it('rejects javascript: links', () => expect(ok(projectSchema, { ...project, githubUrl: 'javascript:alert(1)' }).success).toBe(false));
  it('accepts paths inside this site for demos and images, but not schemes or protocol-relative URLs', () => {
    expect(ok(projectSchema, { ...project, liveUrl: 'demos/quizora.html', imageUrl: 'images/projects/quizora.webp' }).success).toBe(true);
    ['data:text/html,x', '//evil.test/x', '/etc/passwd', 'vbscript:x'].forEach((liveUrl) =>
      expect(ok(projectSchema, { ...project, liveUrl }).success, liveUrl).toBe(false),
    );
  });
  it('requires at least one skill item and a known level', () => {
    expect(ok(skillSchema, { group: 'Programming', level: 'practiced', items: [] }).success).toBe(false);
    expect(ok(skillSchema, { group: 'Programming', level: 'expert', items: ['C'] }).success).toBe(false);
    expect(ok(skillSchema, { group: 'Programming', level: 'practiced', items: ['C'] }).success).toBe(true);
  });
  it('only allows the two experience kinds', () => {
    const base = { title: 'BSCS', place: 'GU TECH' };
    expect(ok(experienceSchema, { ...base, kind: 'education' }).success).toBe(true);
    expect(ok(experienceSchema, { ...base, kind: 'job' }).success).toBe(false);
  });
});
