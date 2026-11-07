// The small console in the About section. Its answers come from src/data/content.js.
import { profile, links, skills, projects, webProjects, education, about } from '../data/content.js';
import { toggleTheme } from './theme.js';

const github = links.find((l) => l.label === 'GitHub');
const linkedin = links.find((l) => l.label === 'LinkedIn');

const commands = {
  help: {
    about: 'list commands',
    run: () => Object.entries(commands).map(([name, c]) => `${name.padEnd(10)} ${c.about}`),
  },
  whoami: {
    about: 'who I am',
    run: () => [`${profile.name} (${profile.shortName})`, `${profile.role} · ${profile.location}`],
  },
  about: {
    about: 'a little more',
    run: () => [about.lead, about.paragraphs[0]],
  },
  skills: {
    about: 'what I know and am learning',
    run: () => skills.map((s) => `${s.group} [${s.level}]: ${s.items.join(', ')}`),
  },
  projects: {
    about: 'list projects',
    run: () => [
      ...projects.map((p) => `${p.number}  ${p.title} — ${p.kind}`),
      ...webProjects.map((p, i) => `${String(projects.length + i + 1).padStart(2, '0')}  ${p.title} — ${p.kind}`),
      'Type “open 1” to jump to a project.',
    ],
  },
  open: {
    about: 'open <n> — jump to project n',
    run: (arg) => {
      const n = Number(arg);
      const total = projects.length + webProjects.length;
      if (!Number.isInteger(n) || n < 1 || n > total) return [`Usage: open <1-${total}>`];
      if (n <= projects.length) {
        document.getElementById(`project-${projects[n - 1].id}`)?.scrollIntoView({ behavior: 'smooth' });
        return [`Opening ${projects[n - 1].title}…`];
      }
      document.querySelector('[data-more-projects]')?.scrollIntoView({ behavior: 'smooth' });
      return [`${webProjects[n - projects.length - 1].title} is under “More work”.`];
    },
  },
  education: {
    about: 'studies so far',
    run: () => education.map((e) => `${e.period.padEnd(20)} ${e.title} — ${e.place}`),
  },
  contact: {
    about: 'how to reach me',
    run: () => [{ text: profile.email, href: `mailto:${profile.email}` }, ...links.map((l) => ({ text: `${l.label}: ${l.handle}`, href: l.href }))],
  },
  github: { about: 'open GitHub', run: () => openLink(github) },
  linkedin: { about: 'open LinkedIn', run: () => openLink(linkedin) },
  theme: {
    about: 'switch light/dark',
    run: () => {
      toggleTheme();
      return [`Theme: ${document.documentElement.dataset.theme}`];
    },
  },
  clear: { about: 'clear the screen', run: () => null },
};

function openLink(link) {
  window.open(link.href, '_blank', 'noopener,noreferrer');
  return [`Opening ${link.label} in a new tab…`];
}

export function initTerminal() {
  const root = document.querySelector('[data-terminal]');
  if (!root) return;
  const output = root.querySelector('[data-terminal-output]');
  const form = root.querySelector('[data-terminal-form]');
  const input = form.querySelector('input');
  const history = [];
  let cursor = 0;

  const line = (content, className) => {
    const p = document.createElement('p');
    if (className) p.className = className;
    if (typeof content === 'object') {
      const a = document.createElement('a');
      a.href = content.href;
      a.textContent = content.text;
      if (content.href.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      p.append(a);
    } else {
      p.textContent = content;
    }
    output.append(p);
  };

  function execute(raw) {
    const [name = '', arg] = raw.trim().toLowerCase().split(/\s+/);
    if (!name) return;
    history.push(raw.trim());
    cursor = history.length;
    if (name === 'clear') {
      output.replaceChildren();
      return;
    }
    line(raw.trim(), 't-cmd');
    const command = commands[name];
    const result = command ? command.run(arg) : [`command not found: ${name} — type “help”.`];
    result?.forEach((item) => line(item));
    output.scrollTop = output.scrollHeight;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    execute(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && cursor > 0) {
      event.preventDefault();
      input.value = history[--cursor];
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      cursor = Math.min(history.length, cursor + 1);
      input.value = history[cursor] ?? '';
    } else if (event.key === 'Tab' && input.value.trim()) {
      const match = Object.keys(commands).find((name) => name.startsWith(input.value.trim().toLowerCase()));
      if (match) {
        event.preventDefault();
        input.value = match;
      }
    }
  });

  root.querySelectorAll('[data-command]').forEach((chip) =>
    chip.addEventListener('click', () => execute(chip.dataset.command)),
  );
}
