// The page frame (header + <main> + footer) shared by the blog pages. Plain strings, no CSS imports,
// so the build can prerender it and the browser can reuse it.
import { header } from './sections/header.js';
import { footer } from './sections/closing.js';

export const BLOG_PATH = '/blog/';

/** `base` is '/' so section links such as /#contact work from /blog/some-post/ too. */
export const shellHtml = ({ current = '', inner = '' } = {}) =>
  `${header('/', current)}<main id="main" class="page">${inner}</main>${footer('/')}`;

/** Body of the 404 page: a clear message and the ways back. */
export const notFoundHtml = () => `
<section class="container page-head">
  <p class="label">Error 404</p>
  <h1 class="page-head__title">This page <em>does not exist</em>.</h1>
  <p class="page-head__lead">The address may be mistyped, or the page has moved. These links will get you back on track.</p>
  <p class="notfound__links"><a class="link-arrow" href="/">Home</a> <a class="link-arrow" href="/blog/">Blog</a> <a class="link-arrow" href="/#projects">Projects</a> <a class="link-arrow" href="/#contact">Contact</a></p>
</section>`;
