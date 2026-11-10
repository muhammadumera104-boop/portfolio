// Contact form: validates with the shared Zod schema, saves the message to the Firestore inbox, emails the
// owner through /api/notify, tells the visitor only what really happened, and falls back to
// the visitor's email app if neither worked (offline, Firebase not configured, rules not deployed).
import { profile } from '../data/content.js';
import { contactSchema, fieldErrors } from '../shared/schemas.js';
import { toast } from '../shared/toast.js';
import { describeOutcome, tooFast } from '../shared/contact-flow.js';

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const openedAt = Date.now();
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

    if (tooFast(openedAt)) {
      status.textContent = 'That was quick. Please check your message and press send again.';
      return;
    }

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    form.classList.add('is-sending');
    status.textContent = 'Sending…';
    try {
      // Save to the inbox and email the owner in parallel; report only what actually happened.
      const [saved, emailed] = await Promise.all([saveToInbox(result.data), notifyOwner(result.data)]);
      const outcome = describeOutcome({ saved, emailed }, profile.email);
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

/** True only when the server confirms the email went out (it answers { ok: false } when email is not set up). */
async function notifyOwner(data) {
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
    return response.ok && body.ok === true;
  } catch (error) {
    console.error('[contact] email', error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
