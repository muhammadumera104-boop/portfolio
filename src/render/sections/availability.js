import { availability as builtInAvailability } from '../../data/content.js';
import { resolveAvailability, availabilityLabel } from '../../shared/availability.js';
import { esc } from '../util.js';

/** The badge for already-cleaned settings (see shared/availability.js). The dot is green-ish when open and grey when closed. */
export const availabilityHtml = (availability) =>
  `<p class="label hero__status${availability.open ? '' : ' is-closed'}" data-availability><span class="status-dot" aria-hidden="true"></span>${esc(availabilityLabel(availability))}</p>`;

/**
 * The badge for a saved document (or the built-in setting). The hero puts it between <!--availability:start--> and
 * <!--availability:end-->, which the build script swaps (build/seo-plugin.js); scripts/hydrate.js also refreshes it in the
 * browser, so a change made in the dashboard shows without a new deploy.
 */
export const availabilityBadge = (saved = null) => availabilityHtml(resolveAvailability(saved, builtInAvailability));
