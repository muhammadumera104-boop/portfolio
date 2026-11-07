// Header state, scroll progress, active section links and the mobile menu.

function initScrollState() {
  const header = document.querySelector('[data-header]');
  const bar = document.querySelector('[data-progress]');
  let pending = false;

  const update = () => {
    pending = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    header.classList.toggle('is-scrolled', scrollY > 24);
  };

  const request = () => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  };

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  update();
}

function initActiveLinks() {
  const links = [...document.querySelectorAll('[data-nav-link]')];
  // Links to other pages (e.g. blog.html) have no hash; links on sub-pages point at sections that are not there.
  const sections = links.map((link) => (link.hash ? document.querySelector(link.hash) : null)).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );

  sections.forEach((section) => observer.observe(section));
}

function initMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;

  const focusables = () => [toggle, ...menu.querySelectorAll('a')];
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function open() {
    menu.hidden = false;
    void menu.offsetHeight; // commit the hidden state so the links transition in
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
    menu.querySelector('a')?.focus();
  }

  function close({ restoreFocus = true } = {}) {
    menu.classList.remove('is-open');
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => close({ restoreFocus: false })));

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      // Keep focus inside the menu while it is open.
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  matchMedia('(min-width: 961px)').addEventListener('change', (event) => {
    if (event.matches && isOpen()) close({ restoreFocus: false });
  });
}

// Switch the header to dark colours while a dark (.inverse) chapter sits under it.
function initHeaderTone() {
  const header = document.querySelector('[data-header]');
  const dark = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? dark.add(entry.target) : dark.delete(entry.target)));
      header.classList.toggle('is-inverse', dark.size > 0);
    },
    { rootMargin: '0px 0px -92% 0px' },
  );
  document.querySelectorAll('.inverse').forEach((section) => observer.observe(section));
}

export function initNav() {
  initScrollState();
  initHeaderTone();
  initActiveLinks();
  initMenu();
}
