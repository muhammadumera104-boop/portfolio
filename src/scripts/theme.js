// Light/dark theme. The initial theme is applied by an inline script in index.html.
const KEY = 'umer-theme';
const root = document.documentElement;
const systemDark = matchMedia('(prefers-color-scheme: dark)');

const saved = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const current = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');

function sync() {
  const dark = current() === 'dark';
  const button = document.querySelector('[data-theme-toggle]');
  button?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', bg));
}

function apply(theme, persist) {
  root.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
  }
  sync();
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export const toggleTheme = () => apply(current() === 'dark' ? 'light' : 'dark', true);

export function initTheme() {
  sync();
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', toggleTheme);
  systemDark.addEventListener('change', (event) => {
    if (!saved()) apply(event.matches ? 'dark' : 'light', false);
  });
}
