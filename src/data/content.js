// ─────────────────────────────────────────────────────────────
// All portfolio content lives here. Edit this file to change
// text, links, skills, projects and education. The page is
// rendered from it at build time (see src/render/), and the
// terminal in the About section reads from it at runtime.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Muhammad Umer Rizwan',
  shortName: 'M. Umer',
  // Other name the owner is also known by. Shown in About and used in the page title and structured data.
  alsoKnownAs: 'Umer Lakhani',
  role: 'Computer science student & developer',
  location: 'Karachi, Pakistan',
  email: 'muhammadumera104@gmail.com',
  // Set to a file in public/images (e.g. 'images/umer-rizwan.jpg') to show a portrait in About.
  portrait: 'images/umer-rizwan.jpg',
  portraitAlt: 'Portrait of Muhammad Umer Rizwan',
  // Small square crop of the portrait, shown as a round photo beside the name in the hero.
  avatar: 'images/umer-avatar.jpg',
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
  { label: 'Journey', href: '#journey' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Blog', href: '/blog/' },
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
    'I’m studying for a BSCS at GU TECH in Karachi. My programming journey began with C, continued with C++ and object-oriented programming, and grew through independent Python learning. I’m now learning HTML, CSS, and JavaScript to bring those foundations to the web.',
    'I enjoy breaking complex problems into manageable parts and keeping code readable. Faculty have recognised my sense of responsibility and teamwork, and I care about being dependable and asking good questions.',
  ],
  facts: [
    { label: 'Also known as', value: 'Umer Lakhani' },
    { label: 'Studying', value: 'BSCS · GU TECH · 2026–2030 (expected)' },
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
    repo: '', // put this project's own repository link here once it is public (never the profile page)
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
    repo: '', // put this project's own repository link here once it is public (never the profile page)
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
    repo: '', // put this project's own repository link here once it is public (never the profile page)
    demo: null,
  },
];

// More work: browser apps and a full-stack project. These use the same shape as the `projects`
// collection in Firestore (see seed.js), so the admin dashboard can edit them. Demo pages live in
// public/demos/ and open in a new tab; screenshots are in public/images/projects/.
export const webProjects = [
  {
    slug: 'gu-tech-lms',
    features: [
      'Admins approve accounts and publish courses',
      'Teachers run lessons, assignments, grading and server-scored timed quizzes',
      'Students learn, submit work and chat',
      'Row-level security on every table and private file storage',
      '59 automated API tests',
    ],
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
    features: [
      'Digital tokens with QR codes',
      'Simulated live queue tracking',
      'Kiosk in English, Urdu and Sindhi, with voice',
      'Floor-plan navigator',
      'Voice-dictated prescriptions linked to pharmacy stock',
      'Admin dashboard',
    ],
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
    features: [
      'Rich-text notes',
      'Task list',
      'Month and week calendar',
      'Focus timer',
      'Subjects and a recycle bin',
      'Global search (Ctrl/⌘ K)',
      'JSON backup and restore',
    ],
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
    features: [
      '36-question bank across six categories and three difficulties',
      'Timed or untimed play',
      'Practice and exam modes',
      'Streak scoring and a daily challenge',
      'Achievements',
      'Full answer review',
    ],
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
    features: [
      'Searchable, sortable menu',
      'Cart drawer',
      'Validated table-reservation form',
      'Gallery lightbox',
      'Review carousel',
    ],
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
    features: [
      'Destination grid with search, sort, category filters and favourites',
      'Generated SVG artwork',
      'Long-form stories',
      'Schematic world map',
      'Newsletter form',
    ],
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

// Repositories shown as picture cards in "Find me online". Clicking a card opens the repository on GitHub. The text
// is taken from each repository's own README, so nothing here is invented; the pictures are in public/images/repos/.
export const featuredRepos = [
  {
    name: 'university-portal',
    title: 'GU TECH Learning Management System',
    url: 'https://github.com/muhammadumera104-boop/university-portal',
    image: 'images/repos/university-portal.webp',
    alt: 'Screenshot of the GU TECH Learning Management System sign-up page',
    language: 'JavaScript',
    text: 'A responsive internal LMS built with React, Vite, Node.js, Express and Supabase. Authenticated operations run through a server API, and PostgreSQL row-level security protects the data.',
    tags: ['React', 'Node.js', 'Supabase'],
  },
  {
    name: 'digital-well-being',
    title: 'MindBridge',
    url: 'https://github.com/muhammadumera104-boop/digital-well-being',
    image: 'images/repos/mindbridge.webp',
    alt: 'MindBridge, a private phone companion for students',
    language: 'HTML',
    text: 'A private phone companion for students: decide before you open the phone, get a warning before time is up, wind down at night, and always know where a real person is.',
    tags: ['HTML', 'PWA', 'Tests'],
  },
  {
    name: 'portfolio',
    title: 'This portfolio',
    url: 'https://github.com/muhammadumera104-boop/portfolio',
    image: 'images/repos/portfolio.webp',
    alt: 'The share image of this portfolio website',
    language: 'JavaScript',
    text: 'The source of this website: a fast static site with a Firebase blog, an admin dashboard, email replies and search-engine prerendering.',
    tags: ['Vite', 'Firebase', 'Vercel'],
  },
];

// The introduction video shown near the top of the home page. `src` is the video file; leave it empty to hide the whole
// section (nothing is rendered without a real video). `transcript` repeats the narration word for word, for readers
// and search engines, and the captions file is public/videos/intro.vtt.
export const introVideo = {
  src: '/videos/intro.mp4',
  poster: '/images/intro-poster.jpg',
  captions: '/videos/intro.vtt',
  title: 'Introduction: Muhammad Umer Rizwan and this portfolio',
  description: 'A two-minute tour: who Muhammad Umer Rizwan (Umer Lakhani) is, his learning journey from C to the web at GU TECH, his projects, the blog and how to get in touch.',
  uploadDate: '2026-11-11',
  duration: 'PT2M2S',
  transcript: [
    'Hello, and welcome.',
    'The portfolio of Muhammad Umer Rizwan, also known as Umer Lakhani, a computer science student at GU TECH in Karachi.',
    'Every skill here was learned step by step.',
    'It began in matriculation, with the C language and the logic of programming.',
    'In intermediate came C++, object-oriented programming, and databases.',
    'Then Python and algorithms, studied independently.',
    'Today he is learning the web, by building real projects.',
    'And from 2026, he studies BSCS at GU TECH.',
    'He learns by building.',
    'Three case studies in C++, Python and C, and six more projects: a learning management system, a hospital queue, a study planner and a quiz app.',
    'Each web project has its own page, with features, links and a live demo.',
    'The blog explains what he learns.',
    'Every post comes with a thumbnail, video guides and further reading.',
    'The site is fast, works on phones, and has a light and a dark mode.',
    'A private admin dashboard lets him publish posts and reply to messages by email.',
    'Want to talk? Use the contact form.',
    'Your message goes straight to his inbox, and he replies by email.',
    'Thank you for watching.',
  ],
};

// The learning journey, in order. Every step comes from the education and skills above; nothing here is invented.
// `current` marks what is being learned right now.
export const journey = [
  {
    when: 'Aug 2019 — May 2024',
    title: 'Matriculation',
    place: 'Bait-Ul-Ilm Secondary School',
    tech: ['C'],
    text: 'Computer science foundations, programming logic and procedural C: the first lines of code.',
  },
  {
    when: 'Aug 2024 — Jun 2026',
    title: 'Intermediate · Computer Science',
    place: 'Govt. Degree Boys College Gulistan-e-Johar',
    tech: ['C++', 'OOP', 'Databases'],
    text: 'C++, object-oriented programming and relational database systems. EduTrack grew out of this stage.',
  },
  {
    when: 'Independent study',
    title: 'Python and algorithms',
    place: 'Self-taught',
    tech: ['Python', 'Algorithms', 'Memory'],
    text: 'Python on my own, plus studies of path-finding (BFS, Dijkstra, A*) and memory allocation that became the interactive demos on this page.',
  },
  {
    when: 'Now',
    title: 'The web',
    place: 'Learning by building',
    tech: ['HTML', 'CSS', 'JavaScript'],
    text: 'Browser apps without a framework, a full-stack learning management system, and this portfolio.',
    current: true,
  },
  {
    when: '2026 — 2030 (expected)',
    title: 'BSCS at GU TECH',
    place: 'GU TECH, Karachi',
    tech: ['Computer science'],
    text: 'Undergraduate computer science studies, building on C, C++ and Python.',
  },
  {
    when: 'Next',
    title: 'What I am exploring',
    place: 'Beyond the syllabus',
    tech: ['Full-stack', 'Automation', 'AI agents', '3D modelling'],
    text: 'Taking the same step-by-step approach into software tools, automation and AI agents.',
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
  { period: '2026 — 2030', note: 'Expected', title: 'BSCS', place: 'GU TECH, Karachi', text: 'Undergraduate computer science studies.' },
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

/**
 * Projects seeded into Firestore before "key features" existed lack that field. For a project that matches a
 * built-in one by slug, a missing or empty `features` list falls back to the built-in text (taken from the project
 * description). Anything set in the dashboard wins.
 */
export function withBuiltInProjectDefaults(project) {
  const builtIn = webProjects.find((p) => p.slug === project.slug);
  if (!builtIn) return project;
  return { ...project, features: project.features?.length ? project.features : builtIn.features || [] };
}
