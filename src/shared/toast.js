// Minimal accessible toast. Used by the contact form, comments and the admin dashboard.
let region;

function getRegion() {
  if (region?.isConnected) return region;
  region = document.createElement('div');
  region.className = 'toasts';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.append(region);
  return region;
}

/** type: 'success' | 'error' | 'info' */
export function toast(message, type = 'info', ms = 4500) {
  const el = document.createElement('p');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  getRegion().append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  const remove = () => {
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 300);
  };
  setTimeout(remove, ms);
  el.addEventListener('click', remove);
}
