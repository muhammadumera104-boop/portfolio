import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSeed } from '../src/data/seed.js';
import { webProjects } from '../src/data/content.js';
import { projectSchema, skillSchema, experienceSchema, postSchema } from '../src/shared/schemas.js';

const seed = buildSeed();
const check = (schema, items) =>
  items.forEach(({ id, data }) => {
    const r = schema.safeParse(data);
    expect(r.success, `${id}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true);
  });

describe('seed data', () => {
  it('every document passes the schema the admin dashboard uses', () => {
    check(projectSchema, seed.projects);
    check(skillSchema, seed.skills);
    check(experienceSchema, seed.experiences);
    check(postSchema, seed.blog_posts);
  });
  it('seeds the three built-in projects with the slugs the home page expects', () => {
    expect(seed.projects.slice(0, 3).map((p) => p.data.slug)).toEqual(['edutrack', 'algovisualizer', 'allocator']);
  });
  it('seeds every "More work" project after the built-in ones', () => {
    expect(seed.projects).toHaveLength(3 + webProjects.length);
    expect(seed.projects.slice(3).map((p) => p.id)).toEqual(webProjects.map((p) => p.slug));
  });
  it('uses unique ids within each collection', () => {
    Object.values(seed).forEach((items) => expect(new Set(items.map((i) => i.id)).size).toBe(items.length));
  });
  it('keeps education and recognition apart', () => {
    expect(seed.experiences.filter((e) => e.data.kind === 'education')).toHaveLength(3);
    expect(seed.experiences.filter((e) => e.data.kind === 'recognition')).toHaveLength(2);
  });
  it('every local demo page and preview image referenced by "More work" exists in public/', () => {
    const local = (v) => v && !/^https?:\/\//.test(v);
    const missing = webProjects
      .flatMap((p) => [p.liveUrl, p.imageUrl])
      .filter(local)
      .filter((path) => !existsSync(resolve(import.meta.dirname, '../public', path)));
    expect(missing).toEqual([]);
  });
  it('gives every "More work" project a unique slug and display order', () => {
    expect(new Set(webProjects.map((p) => p.slug)).size).toBe(webProjects.length);
    expect(new Set(webProjects.map((p) => p.displayOrder)).size).toBe(webProjects.length);
  });
  it('ships the sample post as an unpublished draft', () => {
    expect(seed.blog_posts.every((p) => p.data.published === false)).toBe(true);
  });
});
