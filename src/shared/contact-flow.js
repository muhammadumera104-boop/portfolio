// What to tell a visitor after they send the contact form. The form does two things in parallel: it saves the
// message to the dashboard inbox, and it emails a copy to the owner. The visitor is only told "sent" for what
// really happened; a failure is never reported as success.

/**
 * @param {{saved: boolean, emailed: boolean, confirmed?: boolean}} result
 * @returns {{kind: 'success'|'partial'|'failed', message: string, toast: string}}
 */
export function describeOutcome({ saved, emailed, confirmed = false }, ownerEmail) {
  const outcome = baseOutcome({ saved, emailed }, ownerEmail);
  if (confirmed && outcome.kind !== 'failed') outcome.message += ' A confirmation email is on its way to you (check your spam folder if you do not see it).';
  return outcome;
}

function baseOutcome({ saved, emailed }, ownerEmail) {
  if (saved && emailed) {
    return {
      kind: 'success',
      message: 'Thanks — your message was sent and is in my inbox. I will reply by email.',
      toast: 'Message sent. Thank you!',
    };
  }
  if (emailed) {
    return {
      kind: 'success',
      message: 'Thanks — your message was emailed to me. I will reply by email.',
      toast: 'Message sent. Thank you!',
    };
  }
  if (saved) {
    return {
      kind: 'partial',
      message: `Your message was saved in my dashboard inbox, but the email notification did not go through, so I may take longer to see it. You can also write to ${ownerEmail}.`,
      toast: 'Saved, but the email notification failed.',
    };
  }
  return {
    kind: 'failed',
    message: `Your message could not be sent, so I’m opening your email app. You can also write to ${ownerEmail}.`,
    toast: 'Could not send directly — opening your email app.',
  };
}

/** Form submissions faster than this after the page opened are almost certainly scripts. */
export const MIN_FILL_MS = 2000;

export const tooFast = (openedAt, now = Date.now()) => now - openedAt < MIN_FILL_MS;
