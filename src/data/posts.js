// Built-in blog posts. They show on /blog.html while Firestore is empty or unreachable, and the admin
// "Seed database" button copies them into Firestore so they can be edited there. Once Firestore has
// published posts, those take over and these are no longer shown.
//
// They are explainers based on the projects on this site. Edit the wording so it sounds like you.

const AUTHOR = 'Muhammad Umer Rizwan';
const DATE = '2026-11-07';

export const builtInPosts = [
  {
    slug: 'how-a-free-list-allocator-works',
    title: 'How a free-list allocator works, and why coalescing matters',
    excerpt: 'What happens behind malloc() and free(): blocks, a free list, splitting, and the merge step that stops memory from fragmenting.',
    tags: ['C', 'Systems', 'Memory'],
    content: `
<p>Every time a C program calls <code>malloc()</code>, something has to decide which bytes to hand back. A simple allocator does that with three ideas: a region of memory, a list of free blocks, and a rule for merging them again.</p>
<h2>One region, many blocks</h2>
<p>The allocator starts with one large region and divides it into blocks. Each block begins with a small header that records its size and whether it is free. The memory the program receives is the part right after the header.</p>
<pre><code>struct block {
    size_t size;
    int free;
    struct block *next;
};</code></pre>
<h2>The free list</h2>
<p>Free blocks are linked together in a list. When a program asks for <em>n</em> bytes, the allocator walks the list and takes a block that is big enough. <strong>First fit</strong> takes the first one that works; <strong>best fit</strong> takes the smallest one that works. If the chosen block is much larger than needed, it is split in two: one part is returned and the remainder stays on the list.</p>
<h2>Why coalescing matters</h2>
<p>When a block is freed it goes back on the list. If its neighbours are free too, they should be merged into one larger block. Without that step, memory slowly turns into many tiny free pieces: plenty of free bytes in total, but no single piece big enough for the next request. That is called external fragmentation.</p>
<h2>An experiment to try</h2>
<ul>
  <li>Allocate several small blocks, then free every other one. Ask for a large block. It fails, even though enough memory is free in total.</li>
  <li>Now free the blocks in between. With coalescing, the neighbours merge and the large request succeeds.</li>
</ul>
<p>The home page has an interactive sketch of exactly this, written in JavaScript, with a choice between first fit and best fit. The original study project is in C.</p>`,
  },
  {
    slug: 'dijkstra-vs-a-star',
    title: 'Dijkstra vs A*: seeing what a heuristic saves',
    excerpt: 'Both find a shortest path. The difference is how they choose what to explore next, and how much work the guess saves.',
    tags: ['Python', 'Algorithms', 'Graphs'],
    content: `
<p>Dijkstra's algorithm and A* both find a shortest path on a graph. The difference is how they decide what to explore next.</p>
<h2>Dijkstra: explore by cost so far</h2>
<p>Dijkstra always expands the node with the smallest distance from the start, written <em>g(n)</em>. On an open grid that makes it spread out in every direction like a ripple, including directions that lead away from the goal.</p>
<h2>A*: add a guess about the future</h2>
<p>A* expands the node with the smallest <em>f(n) = g(n) + h(n)</em>, where <em>h(n)</em> estimates the remaining distance to the goal. On a grid where you can move up, down, left and right, a good estimate is the Manhattan distance:</p>
<pre><code>def h(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])</code></pre>
<h2>When the answer stays correct</h2>
<p>A* still returns a shortest path as long as <em>h</em> never overestimates the true remaining cost. Such a heuristic is called admissible, and Manhattan distance is admissible on a four-direction grid. If <em>h</em> is always 0, A* behaves exactly like Dijkstra.</p>
<h2>What you see when you watch them</h2>
<ul>
  <li>Both return a path of the same length.</li>
  <li>A* usually visits far fewer cells when there is a fairly direct route to the goal.</li>
  <li>Walls that force a long detour shrink the advantage, because the heuristic knows nothing about walls.</li>
</ul>
<p>The pathfinding sketch on the home page lets you run BFS, Dijkstra and A* on the same maze and compare how many cells each one visits.</p>`,
  },
  {
    slug: 'what-the-database-should-enforce-in-a-role-based-lms',
    title: 'What the database should enforce in a role-based LMS',
    excerpt: 'Lessons from the GU TECH LMS: roles, row-level security, server-scored quizzes and private files, so the browser is never trusted.',
    tags: ['Supabase', 'Security', 'Full-stack'],
    content: `
<p>A learning management system has three kinds of people with very different powers: admins, teachers and students. The main design question is where those rules live. In the GU TECH LMS the answer is: not in the browser.</p>
<h2>Roles are checked on the server and in the database</h2>
<p>The Express API checks the caller's role on every request. Underneath, Supabase PostgreSQL has row-level security switched on for every table, so even a mistake in the API cannot read rows a user should not see. Two layers means one bug is not enough.</p>
<h2>Quizzes are scored on the server</h2>
<p>If the answers are sent to the browser, they can be read. So the quiz answer keys are kept in a separate private table, and the server marks the attempt. A student gets a score back, never the key.</p>
<h2>Files stay private</h2>
<p>Course materials live in private storage buckets. Downloads use short-lived signed links (60 seconds), and the file type is checked by content rather than by the extension in its name.</p>
<h2>Accounts are not open to the public</h2>
<ul>
  <li>No public sign-up: a student requests an account and stays inactive until an admin approves it.</li>
  <li>Sign-in errors are generic, and repeated failures are rate-limited per address and email.</li>
  <li>Deactivated accounts are rejected on every request, even with a valid token.</li>
</ul>
<h2>Tests protect the rules</h2>
<p>The project has 59 automated API tests that run against an in-memory stand-in for Supabase, so permission rules can be checked on every change.</p>
<p>The project was built with AI assistance. The live site needs an account to sign in, so the walkthrough is in the project's documentation rather than on the public page.</p>`,
  },
  {
    slug: 'building-this-portfolio-static-first-firebase-second',
    title: 'Building this portfolio: static first, Firebase second',
    excerpt: 'Why the site is rendered from one data file at build time, and how Firestore, rules and an admin dashboard were added on top.',
    tags: ['Web', 'Firebase', 'Vite'],
    content: `
<p>This portfolio started as a plain Vite site. All the text, skills and projects live in one file, and a small build step turns that file into HTML. That means the page works without JavaScript and can be read by search engines.</p>
<h2>Adding a database without a rewrite</h2>
<p>I wanted a blog, a contact inbox and an admin page, but I did not want the whole site to depend on a database. So Firebase was added second. When the page loads, it asks Firestore for projects, skills and education. If it gets data, it swaps it in. If it gets nothing, or fails, the visitor still sees the built-in content.</p>
<h2>The rules are the real security</h2>
<p>A Firebase web config is not a secret: it ships in every browser bundle. What protects the data is the rules file.</p>
<ul>
  <li>Visitors can read portfolio content and published posts.</li>
  <li>Visitors can send a contact message or a comment, and the rules check the size of every field.</li>
  <li>A visitor may add exactly one to a post's view counter, and nothing else.</li>
  <li>Everything else needs the owner's verified account.</li>
</ul>
<h2>Small decisions that mattered</h2>
<ul>
  <li>Comments store a name and text only, not an email address, because comments are public.</li>
  <li>Every request has a timeout, because Firestore quietly keeps retrying when it cannot connect.</li>
  <li>Image uploads are optional. Firebase Storage needs a paid plan, so cover images can be pasted as URLs instead.</li>
</ul>
<h2>Tests and checks</h2>
<p>The form rules are written once with Zod and used both in the browser and in the unit tests. A GitHub Actions workflow runs lint, the tests and a build on every push.</p>`,
  },
  {
    slug: 'small-browser-apps-without-a-framework',
    title: 'Notes on building small browser apps without a framework',
    excerpt: 'What building a quiz app, a study planner, a café site and a hospital queue taught me about state, storage and accessibility.',
    tags: ['JavaScript', 'Web', 'Accessibility'],
    content: `
<p>Quizora, StudySpace, Noir &amp; Bean, Wanderlust and MediQueue are each a single HTML file with no framework and no build step. Working at that size makes a few habits very visible.</p>
<h2>Keep state in plain objects and render from it</h2>
<p>Each app holds its data in ordinary objects and has one function that draws the screen from them. When something changes, update the object and call the function. It is easier to reason about than patching the page in many places.</p>
<h2>Treat storage as optional</h2>
<p>All of these apps save progress with <code>localStorage</code>, and every read and write is wrapped in <code>try/catch</code>. Private windows and full storage can make it throw, and the app should keep working anyway.</p>
<pre><code>const save = () => {
  try { localStorage.setItem('key', JSON.stringify(data)); }
  catch (e) { /* storage unavailable: carry on without saving */ }
};</code></pre>
<h2>Escape anything that becomes HTML</h2>
<p>If text from a form or a saved note is inserted with <code>innerHTML</code>, it has to be escaped first. StudySpace also strips scripts and event attributes from the rich-text notes it stores.</p>
<h2>Accessibility is mostly small details</h2>
<ul>
  <li>Use real buttons and labels, and keep a visible focus outline.</li>
  <li>Announce changes with <code>role="status"</code> or <code>aria-live</code>, so toasts and form errors are read out.</li>
  <li>Use the native <code>&lt;dialog&gt;</code> element for modals.</li>
  <li>Respect <code>prefers-reduced-motion</code> and <code>prefers-color-scheme</code>.</li>
</ul>
<h2>Be honest about demo data</h2>
<p>These projects use sample content, simulated queues and fictional brands. Saying so on the page, and in the project descriptions, is better than letting a demo pass for a finished product.</p>`,
  },
].map((post) => ({ authorName: AUTHOR, coverImage: '', published: true, createdAt: DATE, ...post }));
