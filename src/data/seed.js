// Builds the Firestore seed documents from the portfolio content in content.js.
// Pure data (no Firebase imports) so it can be unit-tested; the admin "Seed" button writes it.
import { projects, webProjects, skills, education, recognition } from './content.js';

const SAMPLE_POST = `
<p>This is a <strong>sample draft</strong> so the blog has something to show. Edit it, replace it, or delete it from the admin dashboard — it is not published.</p>
<h2>Why look behind malloc()</h2>
<p>I wanted to understand what actually happens when a C program asks for memory and gives it back. The allocator I studied manages a region of memory, keeps a free list of available blocks, and merges neighbouring free blocks so memory does not fragment into unusable scraps.</p>
<h2>What I focused on</h2>
<ul>
  <li>Handing out blocks from a managed region.</li>
  <li>Tracking free blocks in a list.</li>
  <li>Coalescing neighbours when a block is freed.</li>
</ul>
<p>Replace this text with what <em>you</em> learned.</p>`.trim();

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
    blog_posts: [
      {
        id: 'sample-memory-allocator',
        data: {
          title: 'What I learned looking behind malloc()',
          slug: 'what-i-learned-looking-behind-malloc',
          excerpt: 'A sample draft about free lists and coalescing — edit or delete it.',
          content: SAMPLE_POST,
          coverImage: '',
          tags: ['C', 'Systems'],
          published: false,
          authorName: 'Muhammad Umer Rizwan',
        },
      },
    ],
  };
}
