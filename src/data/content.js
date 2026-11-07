// ─────────────────────────────────────────────────────────────
// All portfolio content lives here. Edit this file to change
// text, links, skills, projects and education. The page is
// rendered from it at build time (see src/render/), and the
// terminal in the About section reads from it at runtime.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Muhammad Umer Rizwan',
  shortName: 'M. Umer',
  role: 'Computer science student & developer',
  location: 'Karachi, Pakistan',
  email: 'muhammadumera104@gmail.com',
  // Set to a file in public/images (e.g. 'images/umer-rizwan.jpg') to show a portrait in About.
  portrait: 'images/umer-rizwan.jpg',
  portraitAlt: 'Portrait of Muhammad Umer Rizwan',
  // Currently-exploring words that rotate in the hero.
  exploring: ['full-stack development', 'automation & software tools', 'AI agents', '3D modelling'],
};

export const links = [
  { label: 'GitHub', href: 'https://github.com/muhammadumera104-boop', handle: 'muhammadumera104-boop' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/muhammad-umer-7aaa73436', handle: 'muhammad-umer-7aaa73436' },
];

export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Blog', href: 'blog.html' },
  { label: 'Contact', href: '#contact' },
];

// Layers of the hero illustration, bottom to top. `current` marks what is being learned now.
export const foundations = [
  { label: 'C', note: 'Procedural foundations · Matric' },
  { label: 'C++ / OOP', note: 'Classes & databases · Intermediate' },
  { label: 'Python', note: 'Independent study' },
  { label: 'HTML · CSS · JS', note: 'Learning now', current: true },
];

export const about = {
  lead: 'I like to understand why a solution works — not only that it does.',
  paragraphs: [
    'I’m studying for a BSCS at GU Tech in Karachi. My programming journey began with C, continued with C++ and object-oriented programming, and grew through independent Python learning. I’m now learning HTML, CSS, and JavaScript to bring those foundations to the web.',
    'I enjoy breaking complex problems into manageable parts and keeping code readable. Faculty have recognised my sense of responsibility and teamwork, and I care about being dependable and asking good questions.',
  ],
  facts: [
    { label: 'Studying', value: 'BSCS · GU Tech · 2026–2030 (expected)' },
    { label: 'Based in', value: 'Karachi, Pakistan' },
    { label: 'Looking for', value: 'Software engineering & frontend internships' },
    { label: 'Exploring', value: 'Full-stack, automation, AI agents, 3D modelling' },
  ],
};

// level: 'practiced' | 'learning' | 'exploring'
export const skills = [
  { group: 'Programming', level: 'practiced', note: 'Coursework and independent study.', items: ['C', 'C++', 'Python', 'Object-oriented programming'] },
  { group: 'Core computer science', level: 'practiced', note: 'How I structure and reason about software.', items: ['DBMS', 'Data structures', 'Algorithms', 'Memory basics'] },
  { group: 'Workflow', level: 'practiced', note: 'Habits across assignments and personal work.', items: ['Problem decomposition', 'Modular design', 'Debugging'] },
  { group: 'Frontend', level: 'learning', note: 'Building web foundations through practice.', items: ['HTML', 'CSS', 'JavaScript'] },
  { group: 'Design & research', level: 'exploring', note: 'Thinking about the people who use software.', items: ['Technical research', 'Requirements', 'Accessibility basics'] },
];

// Words for the moving ticker under the hero.
export const ticker = ['C', 'C++', 'Python', 'Object-oriented programming', 'DBMS', 'Data structures', 'Algorithms', 'HTML — learning', 'CSS — learning', 'JavaScript — learning', 'Clean code', 'Problem solving'];

// `visual` picks the figure rendered for each project: 'edutrack' | 'pathfinder' | 'heap'.
export const projects = [
  {
    id: 'edutrack',
    number: '01',
    title: 'EduTrack Academic Management',
    kind: 'C++ · OOP',
    status: 'Concept project',
    summary: 'An academic management system concept with student and faculty classes, file-based record persistence, input handling, and GPA calculations.',
    problem: 'Keep student records and GPA calculations organised in one place.',
    details: [
      'Models students and faculty as classes, using inheritance and polymorphism.',
      'Persists records to files so data survives between runs.',
      'Validates input and rejects malformed entries.',
      'Calculates GPA from recorded grades.',
    ],
    outcome: 'Practice with inheritance, polymorphism, file handling, and validation in a console application.',
    tech: ['C++17', 'OOP', 'File I/O', 'DBMS concepts'],
    visual: 'edutrack',
    repo: 'https://github.com/muhammadumera104-boop',
    demo: null,
  },
  {
    id: 'algovisualizer',
    number: '02',
    title: 'AlgoVisualizer & Pathfinding Engine',
    kind: 'Python · Algorithms',
    status: 'Concept project',
    summary: 'An algorithm visualisation concept for graph traversal, shortest-path search, and procedural maze generation.',
    problem: 'Make search algorithms visible, so it is clear how each one explores a graph.',
    details: [
      'Graph traversal over a grid of nodes.',
      'Shortest paths with Dijkstra’s algorithm and A*.',
      'Procedural maze generation to create new problems.',
    ],
    outcome: 'A deeper feel for how heuristics change the amount of work a search does.',
    tech: ['Python 3', 'Dijkstra', 'A*', 'Graph theory'],
    visual: 'pathfinder',
    repo: 'https://github.com/muhammadumera104-boop',
    demo: null,
  },
  {
    id: 'allocator',
    number: '03',
    title: 'Custom Memory Allocator & DS Toolkit',
    kind: 'C · Systems',
    status: 'Systems study',
    summary: 'A systems programming study exploring heap allocation, free-list management, block coalescing, and reusable data structures.',
    problem: 'Understand what actually happens behind malloc() and free().',
    details: [
      'Heap allocation from a managed region of memory.',
      'A free list that tracks available blocks.',
      'Coalescing neighbouring free blocks to limit fragmentation.',
      'Reusable data structures built on top.',
    ],
    outcome: 'Comfort with pointers, memory layout, and the cost of fragmentation.',
    tech: ['ANSI C', 'Pointers', 'Memory', 'Data structures'],
    visual: 'heap',
    repo: 'https://github.com/muhammadumera104-boop',
    demo: null,
  },
];

// More work: browser apps and a full-stack project. These use the same shape as the `projects`
// collection in Firestore (see seed.js), so the admin dashboard can edit them. Demo pages live in
// public/demos/ and open in a new tab; screenshots are in public/images/projects/.
export const webProjects = [
  {
    slug: 'gu-tech-lms',
    title: 'GU TECH Learning Management System',
    category: 'Full-stack',
    kind: 'React · Node.js · Supabase',
    status: 'Live · sign-in required',
    summary: 'A role-based learning management system. Admins approve accounts and publish courses; teachers run lessons, assignments, grading and server-scored timed quizzes; students learn, submit work and chat. Row-level security on every table, private file storage and 59 automated API tests. Built with AI assistance.',
    problem: 'Give a department one place for courses, grading and announcements, with access controlled by role.',
    details: [
      'React 19 and Vite front end; Express 5 API with Zod validation, rate limiting and role middleware.',
      'Supabase PostgreSQL with row-level security, Auth and private storage buckets.',
      'Deployed on Vercel: one project serves the site and the API.',
    ],
    outcome: 'First full-stack build: authentication, authorisation, a relational schema and automated tests.',
    techStack: ['React 19', 'Vite', 'Node.js', 'Express 5', 'Supabase', 'PostgreSQL', 'Vercel'],
    imageUrl: 'images/projects/gu-tech-lms.webp',
    liveUrl: 'https://university-portal-phi-one.vercel.app',
    githubUrl: 'https://github.com/muhammadumera104-boop/university-portal',
    featured: true,
    displayOrder: 4,
  },
  {
    slug: 'mediqueue',
    title: 'MediQueue — smart hospital queue',
    category: 'Web',
    kind: 'JavaScript · SVG',
    status: 'Team demo',
    summary: 'A hospital queue concept with digital tokens and QR codes, simulated live queue tracking, a kiosk in English, Urdu and Sindhi with voice, a floor-plan navigator, voice-dictated prescriptions linked to pharmacy stock, and an admin dashboard. Built with M. Hassan. Queue data is simulated.',
    problem: 'Shorten the wait and the confusion in a busy outpatient department.',
    details: [
      'Token registration with a QR code that holds only a random ID.',
      'Multilingual kiosk with browser text-to-speech.',
      'SVG floor map with step-by-step directions, and a pharmacy stock view.',
    ],
    outcome: 'Practice designing for real users: multiple languages, accessibility and a staff view.',
    techStack: ['JavaScript', 'SVG', 'QR codes', 'Web Speech API', 'localStorage'],
    imageUrl: 'images/projects/mediqueue.webp',
    liveUrl: 'demos/mediqueue.html',
    githubUrl: '',
    featured: true,
    displayOrder: 5,
  },
  {
    slug: 'studyspace',
    title: 'StudySpace — personal learning hub',
    category: 'Web',
    kind: 'HTML · CSS · JavaScript',
    status: 'Demo project',
    summary: 'A study planner with rich-text notes, a task list, month and week calendar, a focus timer, subjects, a recycle bin, global search (Ctrl/⌘ K) and JSON backup and restore. Everything is stored in the browser.',
    problem: 'Keep notes, deadlines and study sessions in one calm place.',
    details: [],
    outcome: '',
    techStack: ['JavaScript', 'contenteditable', 'localStorage', 'CSS Grid'],
    imageUrl: 'images/projects/studyspace.webp',
    liveUrl: 'demos/studyspace.html',
    githubUrl: '',
    featured: false,
    displayOrder: 6,
  },
  {
    slug: 'quizora',
    title: 'Quizora — challenge your mind',
    category: 'Web',
    kind: 'HTML · CSS · JavaScript',
    status: 'Demo project',
    summary: 'A quiz app with a 36-question bank across six categories and three difficulties, timed or untimed play, practice and exam modes, streak scoring, a daily challenge, achievements and a full answer review.',
    problem: 'Make revision feel like a game without hiding the right answers.',
    details: [],
    outcome: '',
    techStack: ['JavaScript', 'Web Audio', 'localStorage', 'CSS'],
    imageUrl: 'images/projects/quizora.webp',
    liveUrl: 'demos/quizora.html',
    githubUrl: '',
    featured: false,
    displayOrder: 7,
  },
  {
    slug: 'noir-bean',
    title: 'Noir & Bean — café & dining',
    category: 'Web',
    kind: 'HTML · CSS · JavaScript',
    status: 'Demo project',
    summary: 'A café website with a searchable, sortable menu, a cart drawer, a validated table-reservation form, a gallery lightbox and a review carousel. A fictional brand with sample content; no orders are placed.',
    problem: 'Practise building a polished, responsive multi-section site from scratch.',
    details: [],
    outcome: '',
    techStack: ['HTML5', 'CSS3', 'JavaScript', 'localStorage'],
    imageUrl: 'images/projects/noir-bean.webp',
    liveUrl: 'demos/noir-bean.html',
    githubUrl: '',
    featured: false,
    displayOrder: 8,
  },
  {
    slug: 'wanderlust',
    title: 'Wanderlust — stories beyond borders',
    category: 'Web',
    kind: 'JavaScript · CSS',
    status: 'Demo project',
    summary: 'A travel blog with a destination grid (search, sort, category filters, favourites), generated SVG artwork, long-form stories, a schematic world map and a newsletter form. Fictional editorial sample content.',
    problem: 'Explore filtering, state and generated artwork without any image files.',
    details: [],
    outcome: '',
    techStack: ['JavaScript', 'SVG', 'CSS', 'localStorage'],
    imageUrl: 'images/projects/wanderlust.webp',
    liveUrl: 'demos/wanderlust.html',
    githubUrl: '',
    featured: false,
    displayOrder: 9,
  },
];

export const approach = {
  steps: [
    { number: '01', title: 'Understand the problem', text: 'Clarify the goal, the constraints, and the people the solution serves before writing code.' },
    { number: '02', title: 'Design and build', text: 'Choose a clear structure, then implement the work in small, manageable parts.' },
    { number: '03', title: 'Test and improve', text: 'Try edge cases, fix what breaks, and refine for clarity and usability.' },
  ],
  habits: [
    { title: 'Curious', text: 'I want to understand why a solution works.' },
    { title: 'Structured', text: 'I break complex tasks into manageable parts.' },
    { title: 'Careful', text: 'I value readable code and responsible input handling.' },
    { title: 'Persistent', text: 'I keep practising through coursework and independent learning.' },
    { title: 'Grounded', text: 'I’m building from C, OOP, databases, and algorithms.' },
    { title: 'Collaborative', text: 'I value clear communication and taking responsibility.' },
  ],
};

export const education = [
  { period: '2026 — 2030', note: 'Expected', title: 'BSCS', place: 'GU Tech, Karachi', text: 'Undergraduate computer science studies.' },
  { period: 'Aug 2024 — Jun 2026', title: 'Intermediate · Computer Science', place: 'Govt. Degree Boys College Gulistan-e-Johar', text: 'C++, object-oriented programming, and relational database systems.' },
  { period: 'Aug 2019 — May 2024', title: 'Matriculation', place: 'Bait-Ul-Ilm Secondary School', text: 'Computer science foundations, programming logic, and procedural C.' },
];

export const recognition = [
  { label: 'Distinction', title: 'Hafiz-e-Quran', place: 'Wifaq-Ul-Madaris', text: 'Completed memorisation of the Holy Quran, verified by Wifaq-Ul-Madaris.' },
  { label: 'Languages', title: 'Urdu · English', place: 'Native · Fluent', text: 'Comfortable communicating and collaborating in both.' },
];

export const contact = {
  intro: 'Internship opportunity, collaboration, or a thoughtful conversation — I’d be glad to hear from you.',
  audiences: [
    { title: 'Recruiters & employers', text: 'Interested in software engineering or web development internships where I can contribute and learn from experienced teammates.' },
    { title: 'Collaborators', text: 'Open to small, learning-focused projects with clear goals and room to practise thoughtful development.' },
  ],
};
