import '@fontsource-variable/dm-sans/opsz.css';
import '@fontsource/instrument-serif/latin-400-italic.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/motion.css';
import './styles/app.css';
import './styles/print.css';

import { initTheme } from './scripts/theme.js';
import { initNav } from './scripts/nav.js';
import { initTerminal } from './scripts/terminal.js';
import { initContactForm } from './scripts/contact.js';
import { initPathfinder } from './scripts/pathfinder.js';
import { initHeap } from './scripts/heap.js';
import { initMotion } from './scripts/motion.js';
import { initMoreProjects } from './scripts/more-projects.js';
import { initJourney } from './scripts/journey.js';
import { initHeroFx } from './scripts/hero-fx.js';

// Each feature starts independently, so one failure can't break the rest of the page.
const features = [initTheme, initNav, initTerminal, initContactForm, initPathfinder, initHeap, initMoreProjects, initJourney, initHeroFx, initMotion];
features.forEach((init) => {
  try {
    init();
  } catch (error) {
    console.error(`[${init.name}]`, error);
  }
});

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
document.querySelectorAll('[data-print]').forEach((button) => button.addEventListener('click', () => window.print()));

// Live content from Firestore, loaded after the page is interactive. The built-in content stays if it fails.
const loadLive = () => import('./scripts/hydrate.js').then((m) => m.hydrate()).catch((error) => console.warn('[hydrate]', error));
if ('requestIdleCallback' in window) requestIdleCallback(loadLive, { timeout: 2500 });
else setTimeout(loadLive, 800);
