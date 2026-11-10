// Contact form: validates with the shared Zod schema, saves the message to Firestore, and falls back to
// the visitor's email app if saving is not possible (offline, Firebase not configured, rules not deployed).
import { profile } from '../data/content.js';
import { contactSchema, fieldErrors } from '../shared/schemas.js';
import { toast } from '../shared/toast.js';

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
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

    submit.disabled = true;
    status.textContent = 'Sending…';
    try {
      const { sendContactMessage } = await import('../firebase/api.js');
      await sendContactMessage(result.data);
      // Best effort: also email a copy to the site owner. The message is already saved, so a failure here is ignored.
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
        keepalive: true,
      }).catch(() => {});
      form.reset();
      status.textContent = 'Thanks — your message has been sent.';
      toast('Message sent. Thank you!', 'success');
    } catch (error) {
      console.error('[contact]', error);
      status.textContent = `Could not save your message, so I’m opening your email app. You can also write to ${profile.email}.`;
      toast('Could not send directly — opening your email app.', 'error');
      openMailClient(result.data);
    } finally {
      submit.disabled = false;
    }
  });
}
