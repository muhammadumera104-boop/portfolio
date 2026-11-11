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
// The three case studies are real, tested programs: their source is in the case-studies/ folder of the portfolio
// repository, and the screenshots below are captures of their real output (public/images/projects/).
const CASE_STUDY_REPO = 'https://github.com/muhammadumera104-boop/portfolio/tree/main/case-studies';
const AI_NOTE = 'Written as a study project with AI assistance (Claude), then compiled, run and tested. The code is small enough to read in one sitting, and the files carry comments that explain the reasoning.';

export const projects = [
  {
    id: 'edutrack',
    number: '01',
    title: 'EduTrack Academic Management',
    kind: 'C++ · OOP',
    status: 'Working study project',
    summary: 'A console academic management system in C++17: student and faculty classes, file-based record persistence, input validation and credit-weighted GPA calculation, with 34 automated checks.',
    problem: 'Keep student records and GPA calculations organised in one place, and never lose or corrupt them because of bad input.',
    details: [
      'Student and Faculty inherit from an abstract Person class; one loop prints both through virtual functions (polymorphism).',
      'Records are saved one per line and loaded back; a damaged line is skipped and reported with its line number.',
      'Ids, course codes, credit hours and marks are validated; bad input throws ValidationError and changes nothing.',
      'GPA is weighted by credit hours on a 4.0 scale. People are owned by std::unique_ptr, so there is no manual delete.',
    ],
    outcome: 'A working console program with 34 passing checks (also at -O0 to -O3), and practice with inheritance, polymorphism, file handling and validation.',
    tech: ['C++17', 'OOP', 'File I/O', 'Validation'],
    visual: 'edutrack',
    repo: `${CASE_STUDY_REPO}/edutrack`,
    demo: null,
    process: `${AI_NOTE}\n\nThe design came first: one abstract class, two subclasses, a registry that owns them, and a text file format. Validation was written before the menu, so every rule has a test.`,
    screenshots: [
      { url: 'images/projects/edutrack-validation.webp', alt: 'EduTrack demo output: people are added, while a bad id, a duplicate id, a duplicate course and marks of 140 are rejected with clear messages.' },
      { url: 'images/projects/edutrack-records.webp', alt: 'EduTrack output: the record list, a transcript with a GPA of 3.03, records loaded back from the file, and 34 of 34 tests passing.' },
    ],
    challenges: [
      { challenge: 'Bad input must not crash the menu or leave a half-added record.', solution: 'Every rule throws ValidationError before anything is stored. The menu catches it, prints the message and asks again. A test checks that a rejected result changes nothing.' },
      { challenge: 'A damaged or hand-edited data file.', solution: 'load() parses line by line, skips lines that fail validation and returns a report with the line number of each problem instead of stopping.' },
      { challenge: 'A "|" or ";" typed into a name would break the file format.', solution: 'Names are validated, so those two characters are rejected up front.' },
      { challenge: 'The tests crashed on one computer while the same code passed on others.', solution: 'Shrinking the program until the crash sat in one call showed the cause: a mismatched runtime DLL was being loaded, not a bug in the code. Linking statically fixed it.' },
    ],
    lessons: [
      'A virtual destructor is what makes deleting a Student through a Person pointer safe.',
      'GPA must be weighted by credit hours; a plain average of marks gives a different, wrong number.',
      'Owning objects with std::unique_ptr removes manual delete and the leaks that come with it.',
      'When the same program behaves differently on different setups, suspect the environment before the code, and shrink the program to find the first failing call.',
    ],
  },
  {
    id: 'algovisualizer',
    number: '02',
    title: 'AlgoVisualizer & Pathfinding Engine',
    kind: 'Python · Algorithms',
    status: 'Working study project',
    summary: 'A Python terminal tool that draws BFS, DFS, Dijkstra and A* on a grid with mud, animates the search, and generates repeatable mazes. Standard library only, with 15 tests.',
    problem: 'Make search algorithms visible, so it is clear how each one explores a graph and why they give different answers.',
    details: [
      'Graph traversal over a grid with walls and mud; stepping onto mud costs 5.',
      'Dijkstra and A* share one loop and differ only in the estimate (zero versus Manhattan distance).',
      'Mazes are carved with a recursive backtracker; the same seed always gives the same maze.',
      'Results are drawn as text, and --animate plays the search one picture at a time.',
    ],
    outcome: 'On the built-in grid BFS takes 18 steps at cost 30, while Dijkstra takes 24 steps at cost 24. A deeper feel for how cost and heuristics change what a search does.',
    tech: ['Python 3', 'Dijkstra', 'A*', 'Graph theory'],
    visual: 'pathfinder',
    repo: `${CASE_STUDY_REPO}/algovisualizer`,
    demo: null,
    process: `${AI_NOTE}\n\nThe grid and the four algorithms came first, then the text renderer, then the maze generator. The tests pin down the behaviour that matters: shortest versus cheapest, no route, a start inside a wall, and repeatable mazes.`,
    screenshots: [
      { url: 'images/projects/algovisualizer-race.gif', alt: 'Animation: Dijkstra and A* spreading across the same grid. A* explores 115 cells and Dijkstra 127, and both find a path of cost 24.' },
      { url: 'images/projects/algovisualizer-compare.webp', alt: 'BFS goes straight through the mud (18 steps, cost 30); Dijkstra goes around it (24 steps, cost 24). A table lists all four algorithms.' },
      { url: 'images/projects/algovisualizer-maze.webp', alt: 'A generated 15 by 31 maze with the path found by A* drawn in asterisks from S to G.' },
    ],
    challenges: [
      { challenge: 'Breadth-first search finds the fewest steps, but it ignores cost, so it walked straight through the mud.', solution: 'Dijkstra tracks the real cost of each cell. The demo grid shows the difference: 18 steps at cost 30 for BFS, 24 steps at cost 24 for Dijkstra.' },
      { challenge: 'A priority queue keeps old, more expensive entries for a cell that was already settled.', solution: 'Instead of decreasing keys, the loop skips any cell it has already settled.' },
      { challenge: 'Comparing Dijkstra and A* fairly.', solution: 'They share one function. With an estimate of zero it is Dijkstra; with Manhattan distance it is A*, so the only difference is the estimate.' },
      { challenge: 'Generated mazes must always be solvable.', solution: 'The recursive backtracker builds a perfect maze. A test checks that the number of open cells is exactly 2 x rooms - 1 and that BFS finds the goal for several seeds.' },
    ],
    lessons: [
      'A* stays optimal only if its estimate never promises more than the truth; Manhattan distance with a minimum step cost of 1 is safe.',
      'Heuristics help most when they point the right way: on an open field A* explores a fraction of what Dijkstra does, while on the mud grid the gap is small (115 versus 127 cells).',
      'A fixed neighbour order and a seed make runs repeatable, which is what makes algorithms testable.',
    ],
  },
  {
    id: 'allocator',
    number: '03',
    title: 'Custom Memory Allocator & DS Toolkit',
    kind: 'C · Systems',
    status: 'Working study project',
    summary: 'A malloc and free replacement in C on a fixed 64 KiB heap: first fit, block splitting, coalescing, misuse detection and a heap consistency checker, plus a growing array and a stack built on it. 11,234 automated checks.',
    problem: 'Understand what actually happens behind malloc() and free(), including why a program can fail to allocate when plenty of memory is free.',
    details: [
      'Every block has a header, and headers form a doubly linked list in address order.',
      'my_malloc uses first fit and splits blocks that are bigger than needed; my_free merges free neighbours in both directions.',
      'Double frees, wild pointers and pointers into the middle of a block are reported instead of corrupting the heap.',
      'A Vec and a Stack are built on the allocator and never touch the system malloc, so its statistics show whether they leak.',
    ],
    outcome: 'A working allocator with a demo that shows fragmentation and coalescing, and a 20,000-step random stress test that checks no block is ever overwritten.',
    tech: ['ANSI C', 'Pointers', 'Memory', 'Data structures'],
    visual: 'heap',
    repo: `${CASE_STUDY_REPO}/allocator`,
    demo: null,
    process: `${AI_NOTE}\n\nThe block header and the invariants came first; the invariants became heap_check(). Allocation, freeing and coalescing were added in that order, and the checker ran after almost every test step.`,
    screenshots: [
      { url: 'images/projects/allocator-fragmentation.webp', alt: 'Allocator demo: 34304 bytes are free in three holes, but the largest is 16000 bytes, so a 20000-byte request returns NULL.' },
      { url: 'images/projects/allocator-coalescing.webp', alt: 'Allocator demo: freeing the middle block merges three holes into 26064 bytes, so the 20000-byte request succeeds; 11234 of 11234 tests pass.' },
    ],
    challenges: [
      { challenge: 'Freed blocks must merge with free neighbours on both sides, or the heap fragments for good.', solution: 'Blocks sit in a doubly linked list in address order, so a block\'s list neighbours are its memory neighbours. free() merges forward, then backward.' },
      { challenge: 'Telling a real pointer from a bad one, and catching a double free.', solution: 'Each header carries a magic number plus range and alignment checks. A header that was merged away has its magic cleared, so a stale pointer to it is rejected.' },
      { challenge: 'Proving the heap never gets corrupted.', solution: 'heap_check() verifies the links, alignment and that headers plus payloads add up to the whole arena. The tests call it constantly, and a random stress test fills each block with a pattern and verifies it before freeing.' },
      { challenge: 'A size multiplication overflowing inside calloc.', solution: 'my_calloc checks count against the maximum size before multiplying and returns NULL if it would overflow.' },
    ],
    lessons: [
      'Fragmentation is real: the demo has 34 KB free in total, yet a 20 KB request fails because no single hole is big enough.',
      'Bookkeeping costs memory: every block spends 32 bytes on its header.',
      'First fit is simple, but it walks the list on every allocation; real allocators use size classes and per-thread arenas.',
      'Writing the invariants down as a checker catches mistakes the moment they happen, not many steps later.',
    ],
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

// The "Now" section: what I am building and learning this month (see render/sections/now.js).
// This is the starting content. After the first save in the admin dashboard (Now tab) the dashboard's version is used,
// so you normally never edit this by hand. month is 'YYYY-MM'. At most 5 short lines in each list.
export const now = {
  month: '2026-11',
  building: [
    'This portfolio: case studies, a blog and an admin dashboard',
    'The GU TECH Learning Management System (React, Node.js, Supabase)',
  ],
  learning: [
    'HTML, CSS and JavaScript, by building real pages',
    'Data structures and algorithms in C, C++ and Python',
  ],
  note: '',
};

// Certificates and achievements (see render/sections/certificates.js). Only add things that are really yours.
// date is '2025-03' (year and month) or '2025' (year only). url is optional: an https link where anyone can verify the
// certificate (Coursera, Credly, a university page ...). While both lists are empty the whole section is left out.
// Example certificate:
//   { title: 'Python for Everybody', issuer: 'Coursera, University of Michigan', date: '2025-03', url: 'https://www.coursera.org/account/accomplishments/verify/XXXX' },
// Example achievement:
//   { title: 'First place, university coding contest', detail: 'One sentence about what happened and what you did.', date: '2026-01', url: '' },
export const certificates = [];
export const achievements = [];

// Testimonials: 2 or 3 short quotes from real people, shown in their own section (see render/sections/testimonials.js).
// Rules: only add words a person actually said or wrote, and ask their permission to publish them with their name.
// "url" must be an https link where a visitor can check who they are (a LinkedIn page, a faculty page, a GitHub profile).
// While this list is empty, the whole section is left out of the page. Example of one entry:
//   {
//     quote: 'A short sentence or two, in their own words (20 to 400 characters).',
//     name: 'Full Name',
//     role: 'Lecturer, GU TECH',
//     url: 'https://www.linkedin.com/in/their-profile',
//   },
export const testimonials = [];

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
