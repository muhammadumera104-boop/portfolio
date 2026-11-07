// Category filter for the "More work" cards. One delegated listener on the container, so it keeps
// working when hydrate.js swaps the cards for the live Firestore versions.
export function initMoreProjects() {
  const host = document.querySelector('[data-more-projects]');
  if (!host) return;

  host.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const wanted = button.dataset.filter;
    host.querySelectorAll('[data-filter]').forEach((b) => {
      const on = b === button;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    host.querySelectorAll('.more-card').forEach((card) => {
      card.hidden = Boolean(wanted) && card.dataset.category !== wanted;
    });
  });
}
