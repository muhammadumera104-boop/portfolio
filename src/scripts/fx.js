// Small "tech" effects, added one at a time. Plain JavaScript, no libraries.
//
// Effect 1: the name in the hero decodes. Each letter flickers through random code characters
// ({ } < > 0 1 …) and then settles, from left to right, on the real letter.

const GLYPHS = '{}<>01/\\;=+*#[]()';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// A random code character.
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

function decodeName() {
  const target = document.querySelector('.hero__name-main');
  // The visible name is the first plain-text piece inside this element (the rest is a hidden " — " for screen readers).
  const textNode = [...(target?.childNodes || [])].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  if (!textNode) return;

  const name = textNode.textContent.trim();

  // Put the name in one wrapper. Screen readers keep reading the real name; the flickering copy is hidden from them.
  const real = document.createElement('span');
  real.className = 'sr-only';
  real.textContent = name;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  textNode.replaceWith(real, visual);

  // One box per letter, each locked to the width of the real letter. Random characters have other widths,
  // and without this the line would wobble (and push things around) while it flickers.
  const letters = [...name].map((char) => {
    const box = document.createElement('span');
    box.textContent = char;
    visual.append(box);
    return { box, char };
  });
  letters.forEach((letter) => (letter.width = letter.box.getBoundingClientRect().width));
  letters.forEach(({ box, char, width }) => {
    if (char === ' ') return;
    box.style.cssText = `display:inline-block;width:${width}px;text-align:center`;
  });

  const start = performance.now();
  const FLICKER = 350;  // ms before the first letter may settle
  const STAGGER = 45;   // ms between one letter settling and the next
  const TICK = 55;      // ms between random-character changes
  let lastTick = 0;
  let frame = 0;

  function step(now) {
    const elapsed = now - start;
    const redraw = now - lastTick >= TICK;
    if (redraw) lastTick = now;
    let finished = true;

    letters.forEach((letter, index) => {
      if (letter.char === ' ' || letter.done) return;
      if (elapsed >= FLICKER + index * STAGGER) {
        letter.box.textContent = letter.char; // this letter has settled
        letter.done = true;
      } else {
        finished = false;
        if (redraw) letter.box.textContent = randomGlyph();
      }
    });

    if (finished) return finish();
    frame = requestAnimationFrame(step);
  }

  // Put back a single plain text node, exactly like the original page.
  function finish() {
    cancelAnimationFrame(frame);
    real.remove();
    visual.replaceWith(document.createTextNode(name));
  }

  // Scramble immediately so the first frame is already code, not the finished name.
  letters.forEach((letter) => letter.char !== ' ' && (letter.box.textContent = randomGlyph()));
  frame = requestAnimationFrame(step);
}

export function initFx() {
  if (reduceMotion.matches) return;
  // On the first visit of a session an intro panel covers the hero for about 2.5s: wait for it, so the visitor sees the effect.
  const delay = document.querySelector('.intro') ? 2300 : 500;
  setTimeout(decodeName, delay);
}
