// Figures for each project. These are illustrations and in-browser sketches written for
// this site — they are labelled as such and are not screenshots of the original programs.
import { esc } from './util.js';

const umlBox = (x, y, w, title, rows, accent = false) => {
  const h = 34 + rows.length * 20 + 12;
  return `<g class="uml${accent ? ' uml--accent' : ''}" transform="translate(${x} ${y})">
    <rect class="uml__box" width="${w}" height="${h}"/>
    <rect class="uml__head" width="${w}" height="34"/>
    <text class="uml__title" x="14" y="22">${esc(title)}</text>
    ${rows.map((r, i) => `<text class="uml__row" x="14" y="${56 + i * 20}">${esc(r)}</text>`).join('')}
  </g>`;
};

const edutrack = () => `
<div class="edu-figure">
  <svg class="edu-figure__uml" viewBox="0 0 640 420" role="img" aria-labelledby="uml-t">
    <title id="uml-t">Illustrative class structure: Student and Faculty inherit from Person; a RecordStore saves and loads records from files.</title>
    <g class="uml__grid">${Array.from({ length: 15 }, (_, i) => `<path d="M${i * 44 + 12} 0v420"/>`).join('')}</g>
    ${umlBox(214, 24, 212, 'Person', ['# name : string', '# id : string', '+ display() : virtual'])}
    ${umlBox(40, 252, 230, 'Student', ['- grades : vector<float>', '+ gpa() : float', '+ display() : override'], true)}
    ${umlBox(370, 252, 230, 'Faculty', ['- department : string', '- courses : vector<string>', '+ display() : override'])}
    <path class="uml__edge" d="M155 252V200h165v-54M485 252V200H320"/>
    <path class="uml__arrow" d="M320 130l-9 16h18z"/>
    <g class="uml__note" transform="translate(470 96)"><rect width="150" height="64"/><text x="12" y="26">RecordStore</text><text x="12" y="48">save() · load()</text></g>
    <path class="uml__edge uml__edge--dash" d="M470 128h-44"/>
  </svg>
  <pre class="edu-figure__console" aria-hidden="true"><span class="c-dim">EDUTRACK — academic records</span>
<span class="c-dim">────────────────────────────</span>
 [1] Add student
 [2] Add faculty
 [3] Record grades
 <span class="c-hi">[4] Calculate GPA</span>
 [5] Save &amp; exit
<span class="c-dim">&gt;</span> 4<span class="c-caret"></span></pre>
</div>`;

const pathfinder = () => `
<div class="pf" data-pathfinder>
  <div class="pf__controls">
    <fieldset class="seg">
      <legend class="sr-only">Search algorithm</legend>
      <label><input type="radio" name="pf-algo" value="bfs" checked><span>BFS</span></label>
      <label><input type="radio" name="pf-algo" value="dijkstra"><span>Dijkstra</span></label>
      <label><input type="radio" name="pf-algo" value="astar"><span>A*</span></label>
    </fieldset>
    <div class="pf__actions">
      <button type="button" class="btn btn--accent btn--sm" data-pf="run">Run search</button>
      <button type="button" class="btn btn--line btn--sm" data-pf="maze">New maze</button>
      <button type="button" class="btn btn--line btn--sm" data-pf="clear">Clear walls</button>
    </div>
  </div>
  <div class="pf__stage">
    <canvas class="pf__canvas" data-pf-canvas role="img" aria-label="Grid where a search algorithm finds a path from the start node to the goal node."></canvas>
    <noscript><p class="pf__noscript">This interactive sketch needs JavaScript.</p></noscript>
  </div>
  <div class="pf__stats" aria-live="polite">
    <span><span class="label">Algorithm</span><b data-pf-algo>BFS</b></span>
    <span><span class="label">Nodes visited</span><b data-pf-visited>—</b></span>
    <span><span class="label">Path length</span><b data-pf-path>—</b></span>
    <span class="pf__legend label"><i class="k-start"></i>Start <i class="k-goal"></i>Goal <i class="k-wall"></i>Wall</span>
  </div>
  <p class="pf__hint">Drag on the grid to draw or erase walls. On an unweighted grid BFS and Dijkstra find equally short paths; A* uses a distance heuristic to visit fewer nodes.</p>
</div>`;

const heap = () => `
<div class="heap" data-heap>
  <div class="heap__controls">
    <fieldset class="seg">
      <legend class="label">Request</legend>
      ${[4, 8, 12, 16].map((n, i) => `<label><input type="radio" name="heap-size" value="${n}"${i === 1 ? ' checked' : ''}><span>${n}</span></label>`).join('')}
    </fieldset>
    <fieldset class="seg">
      <legend class="label">Strategy</legend>
      <label><input type="radio" name="heap-fit" value="first" checked><span>First fit</span></label>
      <label><input type="radio" name="heap-fit" value="best"><span>Best fit</span></label>
    </fieldset>
    <div class="heap__actions">
      <button type="button" class="btn btn--accent btn--sm" data-heap="alloc"><code>malloc()</code></button>
      <button type="button" class="btn btn--line btn--sm" data-heap="reset">Reset</button>
    </div>
  </div>
  <ul class="heap__bar" data-heap-bar aria-label="Heap blocks, in address order"></ul>
  <div class="heap__scale label" aria-hidden="true"><span>0x00</span><span>0x10</span><span>0x20</span><span>0x30</span><span>0x40</span></div>
  <div class="heap__readout">
    <p class="heap__log" data-heap-log aria-live="polite">A 64-unit heap. Allocate blocks, then select one to free it.</p>
    <p class="heap__free"><span class="label">Free list</span> <code data-heap-free>[0x00 · 64]</code></p>
  </div>
  <noscript><p class="pf__noscript">This interactive sketch needs JavaScript.</p></noscript>
</div>`;

export const figures = { edutrack, pathfinder, heap };

// Small thumbnails shown beside the cursor in the project index.
export const minis = {
  edutrack: `<svg viewBox="0 0 160 110"><rect x="55" y="10" width="50" height="30"/><rect x="12" y="68" width="56" height="30" class="m-accent"/><rect x="92" y="68" width="56" height="30"/><path d="M40 68V54h80v14M80 54V40"/></svg>`,
  pathfinder: `<svg viewBox="0 0 160 110">${Array.from({ length: 7 }, (_, r) => Array.from({ length: 10 }, (_, c) => `<rect x="${8 + c * 15}" y="${4 + r * 15}" width="13" height="13" class="${(r === 3 && c < 8) || (c === 7 && r > 3) ? 'm-accent' : (c === 4 && r < 3) || (r === 5 && c > 1 && c < 5) ? 'm-fill' : ''}"/>`).join('')).join('')}</svg>`,
  heap: `<svg viewBox="0 0 160 110"><rect x="8" y="35" width="34" height="40" class="m-fill"/><rect x="44" y="35" width="22" height="40"/><rect x="68" y="35" width="44" height="40" class="m-accent"/><rect x="114" y="35" width="38" height="40"/></svg>`,
};
