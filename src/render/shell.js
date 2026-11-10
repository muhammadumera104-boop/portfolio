// The page frame (header + <main> + footer) shared by the blog pages. Plain strings, no CSS imports,
// so the build can prerender it and the browser can reuse it.
import { header } from './sections/header.js';
import { footer } from './sections/closing.js';

export const BLOG_PATH = '/blog/';

/** `base` is '/' so section links such as /#contact work from /blog/some-post/ too. */
export const shellHtml = ({ current = '', inner = '' } = {}) =>
  `${header('/', current)}<main id="main" class="page">${inner}</main>${footer('/')}`;
