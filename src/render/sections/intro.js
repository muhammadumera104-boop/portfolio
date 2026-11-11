import { introVideo } from '../../data/content.js';
import { esc, list } from '../util.js';

/**
 * The introduction video. Nothing at all is rendered unless a real video file is set, so there is never an empty player.
 * The video loads only when played (preload="none"); captions are on by default and the full transcript is on the page.
 */
export const introSection = () =>
  introVideo.src
    ? `
<section class="section intro-video" id="intro" aria-labelledby="intro-title">
  <div class="container">
    <p class="label section-head__label"><span class="section-head__index">(Video)</span> Introduction</p>
    <h2 class="intro-video__title" id="intro-title">Meet Umer in <em>two minutes.</em></h2>
    <figure class="intro-video__figure">
      <video class="intro-video__player" controls playsinline preload="none" width="1920" height="1080" poster="${esc(introVideo.poster)}" aria-label="${esc(introVideo.title)}">
        <source src="${esc(introVideo.src)}" type="video/mp4">
        <track kind="captions" srclang="en" label="English" src="${esc(introVideo.captions)}" default>
        <p>Your browser cannot play this video. Read the transcript below instead.</p>
      </video>
      <figcaption class="intro-video__caption label">${esc(introVideo.description)}</figcaption>
    </figure>
    <details class="intro-video__transcript">
      <summary>Read the transcript</summary>
      <ol>${list(introVideo.transcript, (line) => `<li>${esc(line)}</li>`)}</ol>
    </details>
  </div>
</section>`
    : '';
