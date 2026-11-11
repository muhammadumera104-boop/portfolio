// Builds the Firestore seed documents from the portfolio content in content.js.
// Pure data (no Firebase imports) so it can be unit-tested; the admin "Seed" button writes it.
import { projects, webProjects, skills, education, recognition } from './content.js';
import { builtInPosts } from './posts.js';
import { readingTime } from '../shared/utils.js';

export function buildSeed() {
  return {
    projects: [...projects.map((p, i) => ({
      id: p.id,
      data: {
        title: p.title,
        slug: p.id,
        category: p.kind.split('·')[0].trim(),
        kind: p.kind,
        status: p.status,
        summary: p.summary,
        problem: p.problem,
        details: p.details,
        outcome: p.outcome,
        techStack: p.tech,
        imageUrl: '',
        liveUrl: p.demo || '',
        githubUrl: p.repo || '',
        // Optional real content (add it in content.js or in the admin dashboard); empty means the section is hidden.
        screenshots: p.screenshots || [],
        challenges: p.challenges || [],
        lessons: p.lessons || [],
        process: p.process || '',
        featured: true,
        displayOrder: i + 1,
      },
    })),
    ...webProjects.map(({ slug, ...data }) => ({ id: slug, data: { slug, ...data } })),
    ],
    skills: skills.map((s, i) => ({
      id: `skill-${String(i + 1).padStart(2, '0')}`,
      data: { group: s.group, level: s.level, note: s.note, items: s.items, displayOrder: i + 1 },
    })),
    experiences: [
      ...education.map((e, i) => ({
        id: `edu-${String(i + 1).padStart(2, '0')}`,
        data: { kind: 'education', title: e.title, place: e.place, period: e.period, note: e.note || '', text: e.text, displayOrder: i + 1 },
      })),
      ...recognition.map((r, i) => ({
        id: `rec-${String(i + 1).padStart(2, '0')}`,
        data: { kind: 'recognition', title: r.title, place: r.place, period: '', note: r.label, text: r.text, displayOrder: 100 + i },
      })),
    ],
    // The posts bundled with the site (src/data/posts.js), copied into Firestore so they can be edited there.
    blog_posts: builtInPosts.map(({ slug, title, subtitle, excerpt, category, content, coverImage, videos, resources, tags, published, authorName }) => ({
      id: slug,
      data: { title, subtitle, slug, excerpt, category, content, coverImage, videos, resources, tags, published, authorName, readingTime: readingTime(content) },
    })),
  };
}
