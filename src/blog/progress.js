// Reading-progress bar for blog posts. It reuses the thin bar at the top of the page (scripts/nav.js draws it for
// ordinary pages), and takes it over while a post is on screen so it measures the article text, not the whole page.
import { readingProgress } from '../shared/reading-progress.js';

export function initReadingProgress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  let pending = false;

  const update = () => {
    pending = false;
    const prose = document.querySelector('[data-prose]');
    if (!prose) {
      bar.dataset.mode = ''; // no article yet (or not a post): nav.js keeps drawing the whole-page progress
      return;
    }
    bar.dataset.mode = 'article';
    const { top, height } = prose.getBoundingClientRect();
    bar.style.transform = `scaleX(${readingProgress({ top, height, viewport: innerHeight })})`;
  };

  const request = () => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  };

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  // The article may be swapped in a moment after load (live data), so look again shortly.
  [0, 400, 1500].forEach((ms) => setTimeout(request, ms));
}
