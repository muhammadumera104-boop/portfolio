// Builds the page body from src/data/content.js. Called by the Vite plugin in
// vite.config.js, so the HTML is static and readable without JavaScript.
import { header } from './sections/header.js';
import { hero } from './sections/hero.js';
import { marquee, aboutSection, skillsSection } from './sections/about.js';
import { projectsSection } from './sections/projects.js';
import { journeySection } from './sections/journey.js';
import { introSection } from './sections/intro.js';
import { onlineSection } from './sections/online.js';
import { approachSection, educationSection, contactSection, footer } from './sections/closing.js';

export const render = () => `
${header()}
<main id="main">
  ${hero()}
  ${marquee()}
  ${introSection()}
  ${aboutSection()}
  ${skillsSection()}
  ${journeySection()}
  ${projectsSection()}
  ${approachSection()}
  ${educationSection()}
  <!--latest-posts-->
  ${onlineSection()}
  ${contactSection()}
</main>
${footer()}`;
