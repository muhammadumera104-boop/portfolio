// Contact form: validates with the shared Zod schema, saves the message to the Firestore inbox, emails the
// owner through /api/notify, tells the visitor only what really happened, and falls back to
// the visitor's email app if neither worked (offline, Firebase not configured, rules not deployed).
import { profile } from '../data/content.js';
import { contactSchema, fieldErrors } from '../shared/schemas.js';
import { toast } from '../shared/toast.js';
import { describeOutcome, tooFast } from '../shared/contact-flow.js';
import { suggestEmail } from '../shared/email-check.js';

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const openedAt = Date.now();
  let confirmedEmail = ''; // an address the visitor chose to keep after we asked "did you mean ...?"
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const fields = [...form.querySelectorAll('input[name="name"], input[name="email"], textarea')];

  const show = (errors) => {
    fields.forEach((field) => {
      const error = errors[field.name] || '';
      const slot = document.getElementById(`${field.id}-err`);
      slot.textContent = error;
      field.setAttribute('aria-invalid', String(Boolean(error)));
      if (error) field.setAttribute('aria-describedby', slot.id);
      else field.removeAttribute('aria-describedby');
    });
  };

  const read = () => Object.fromEntries(new FormData(form));
  const validate = () => {
    const result = contactSchema.safeParse(read());
    show(result.success ? {} : fieldErrors(result.error));
    return result;
  };

  fields.forEach((field) =>
    field.addEventListener('blur', () => {
      if (!field.value) return;
      const result = contactSchema.safeParse(read());
      const errors = result.success ? {} : fieldErrors(result.error);
      // Only touch this field's message on blur, so untouched fields stay quiet.
      const slot = document.getElementById(`${field.id}-err`);
      slot.textContent = errors[field.name] || '';
      field.setAttribute('aria-invalid', String(Boolean(errors[field.name])));
    }),
  );

  const openMailClient = (data) => {
    const subject = encodeURIComponent(`Portfolio message from ${data.name}`);
    const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (read().website) return; // honeypot: real visitors never fill this in
    const result = validate();
    if (!result.success) {
      status.textContent = 'Please fix the highlighted fields.';
      toast('Please fix the highlighted fields.', 'error');
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    // A mistyped domain (gma5l.com) is accepted by mail servers and bounces later, so ask now, once.
    const guess = suggestEmail(result.data.email);
    if (guess && confirmedEmail !== result.data.email) {
      confirmedEmail = result.data.email;
      const slot = document.getElementById('c-email-err');
      slot.textContent = `Did you mean ${guess}? Please check your address so I can reply. Press send again if it is correct.`;
      form.elements.email.setAttribute('aria-invalid', 'true');
      form.elements.email.focus();
      status.textContent = 'Please check your email address.';
      return;
    }

    if (tooFast(openedAt)) {
      status.textContent = 'That was quick. Please check your message and press send again.';
      return;
    }

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    form.classList.add('is-sending');
    status.textContent = 'Sending…';
    try {
      // The server saves the message to the dashboard inbox AND emails the owner in one request. The browser's own
      // Firestore save is only a backup, used when the server could not save (offline, server error).
      const server = await sendToServer(result.data);
      const emailed = server?.emailed === true;
      const confirmed = server?.confirmed === true; // the server also sent the visitor an automatic confirmation
      const saved = server?.saved === true || (await saveToInbox(result.data));
      const outcome = describeOutcome({ saved, emailed, confirmed }, profile.email);
      status.textContent = outcome.message;
      status.dataset.state = outcome.kind;
      if (outcome.kind === 'failed') {
        toast(outcome.toast, 'error');
        openMailClient(result.data);
      } else {
        toast(outcome.toast, outcome.kind === 'success' ? 'success' : 'info');
        form.reset();
      }
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      form.classList.remove('is-sending');
    }
  });
}

async function saveToInbox(data) {
  try {
    const { sendContactMessage } = await import('../firebase/api.js');
    await sendContactMessage(data);
    return true;
  } catch (error) {
    console.error('[contact] inbox', error);
    return false;
  }
}

/** @returns {Promise<{saved: boolean, emailed: boolean, confirmed: boolean} | null>} what the server confirms, or null if it could not be reached */
async function sendToServer(data) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return { saved: body.saved === true, emailed: body.ok === true, confirmed: body.confirmed === true };
  } catch (error) {
    console.error('[contact] server', error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
