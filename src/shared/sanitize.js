// One place that decides what post HTML may contain. Used when a post is shown to visitors
// (and by the unit tests). Posts are written by the owner, but they are cleaned anyway.
//
// Allowed on top of ordinary text formatting: YouTube videos embedded through
// youtube-nocookie.com. Every other iframe, script, event handler and javascript: link is removed.
import DOMPurify from 'dompurify';

/** https://www.youtube-nocookie.com/embed/<11-character id>[?player options] (or youtube.com/embed) */
export const YOUTUBE_EMBED = /^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[\w-]{11}(?:\?[\w=&%.-]*)?$/;

const configured = new WeakSet();

// `purify` is DOMPurify bound to a window. The browser uses the default; the build passes one made from jsdom.
function configure(purify) {
  if (configured.has(purify)) return;
  configured.add(purify);
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    if (node.tagName === 'IFRAME') {
      if (!YOUTUBE_EMBED.test(node.getAttribute('src') || '')) {
        node.remove();
        return;
      }
      node.setAttribute('loading', 'lazy');
      node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      node.setAttribute('allow', 'accelerometer; encrypted-media; picture-in-picture; fullscreen');
      node.setAttribute('allowfullscreen', '');
      if (!node.getAttribute('title')) node.setAttribute('title', 'YouTube video');
    }
  });
}

/** Returns safe HTML for a post body. */
export function cleanPostHtml(html, purify = DOMPurify) {
  configure(purify);
  return purify.sanitize(String(html), {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['iframe'],
    // Posts never need forms, controls or page-level styling; blocking them also rules out fake login boxes.
    FORBID_TAGS: ['form', 'input', 'button', 'textarea', 'select', 'option', 'object', 'embed', 'style', 'link', 'meta', 'base'],
    FORBID_ATTR: ['style'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy', 'target', 'data-youtube-video'],
  });
}

/** True for youtube.com/watch, youtu.be, /embed and /shorts links, with or without https://. */
export function looksLikeYoutubeUrl(value) {
  return /^(https?:\/\/)?((www|m)\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be)\/\S+/i.test(String(value).trim());
}
