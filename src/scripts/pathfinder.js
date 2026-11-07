// AlgoVisualizer sketch: BFS, Dijkstra and A* on a grid, with maze generation.
// A small JavaScript re-creation of the idea for this page (the original is Python).

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Minimal binary heap ordered by `priority`, used by Dijkstra and A*.
class MinHeap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
  }
  push(value, priority) {
    const a = this.items;
    a.push({ value, priority });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].priority <= a[i].priority) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].priority < a[m].priority) m = l;
        if (r < a.length && a[r].priority < a[m].priority) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top.value;
  }
}

function search(grid, algo) {
  const { cols, rows, walls, start, goal } = grid;
  const total = cols * rows;
  const prev = new Int32Array(total).fill(-1);
  const dist = new Float64Array(total).fill(Infinity);
  const done = new Uint8Array(total);
  const order = [];
  const h = (i) => Math.abs((i % cols) - (goal % cols)) + Math.abs(Math.floor(i / cols) - Math.floor(goal / cols));
  const neighbours = (i) => {
    const x = i % cols;
    const out = [];
    if (i >= cols) out.push(i - cols);
    if (x < cols - 1) out.push(i + 1);
    if (i < total - cols) out.push(i + cols);
    if (x > 0) out.push(i - 1);
    return out.filter((n) => !walls[n]);
  };

  dist[start] = 0;
  if (algo === 'bfs') {
    const queue = [start];
    done[start] = 1;
    for (let q = 0; q < queue.length; q++) {
      const cur = queue[q];
      order.push(cur);
      if (cur === goal) break;
      for (const n of neighbours(cur)) {
        if (done[n]) continue;
        done[n] = 1;
        prev[n] = cur;
        queue.push(n);
      }
    }
  } else {
    const heap = new MinHeap();
    // Tie-break on h so A* prefers nodes closer to the goal.
    heap.push(start, algo === 'astar' ? h(start) : 0);
    while (heap.size) {
      const cur = heap.pop();
      if (done[cur]) continue;
      done[cur] = 1;
      order.push(cur);
      if (cur === goal) break;
      for (const n of neighbours(cur)) {
        const d = dist[cur] + 1;
        if (d < dist[n]) {
          dist[n] = d;
          prev[n] = cur;
          heap.push(n, algo === 'astar' ? d + h(n) + h(n) * 1e-3 : d);
        }
      }
    }
  }

  const path = [];
  if (prev[goal] !== -1 || goal === start) {
    for (let at = goal; at !== -1; at = prev[at]) path.unshift(at);
  }
  return { order, path };
}

// Seeded random so the first layout is the same on every visit.
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function scatter(grid, random) {
  const { cols, rows, walls } = grid;
  walls.fill(0);
  // Short wall segments read better than single-cell noise.
  const segments = Math.round((cols * rows) / 14);
  for (let s = 0; s < segments; s++) {
    let x = Math.floor(random() * cols);
    let y = Math.floor(random() * rows);
    const horizontal = random() > 0.5;
    const length = 2 + Math.floor(random() * 4);
    for (let k = 0; k < length; k++) {
      if (x < cols && y < rows) walls[y * cols + x] = 1;
      if (horizontal) x++;
      else y++;
    }
  }
}

function maze(grid, random) {
  const { cols, rows, walls } = grid;
  walls.fill(1);
  // Recursive backtracker on odd coordinates.
  const stack = [[1, 1]];
  walls[cols + 1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = [[2, 0], [-2, 0], [0, 2], [0, -2]]
      .map(([dx, dy]) => [x + dx, y + dy, x + dx / 2, y + dy / 2])
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && walls[ny * cols + nx]);
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [nx, ny, mx, my] = options[Math.floor(random() * options.length)];
    walls[my * cols + mx] = 0;
    walls[ny * cols + nx] = 0;
    stack.push([nx, ny]);
  }
  // Open a few extra gaps so there is more than one route.
  for (let i = 0; i < cols * rows * 0.04; i++) {
    const x = 1 + Math.floor(random() * (cols - 2));
    const y = 1 + Math.floor(random() * (rows - 2));
    if ((x + y) % 2 === 1) walls[y * cols + x] = 0;
  }
}

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

export function initPathfinder() {
  const root = document.querySelector('[data-pathfinder]');
  if (!root) return;
  const canvas = root.querySelector('[data-pf-canvas]');
  const ctx = canvas.getContext('2d');
  const out = {
    algo: root.querySelector('[data-pf-algo]'),
    visited: root.querySelector('[data-pf-visited]'),
    path: root.querySelector('[data-pf-path]'),
  };
  const names = { bfs: 'BFS', dijkstra: 'Dijkstra', astar: 'A*' };
  const random = rng(7);

  let grid;
  let result = null; // { order, path }
  let shown = { visited: 0, path: 0 };
  let raf = 0;
  let colors;

  const algo = () => root.querySelector('input[name="pf-algo"]:checked').value;

  function readColors() {
    const style = getComputedStyle(root);
    const fg = style.getPropertyValue('--fg').trim() || '#f4f1ea';
    const bg = style.getPropertyValue('--bg').trim() || '#111111';
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--vermilion').trim() || '#f0442e';
    colors = { bg, fg, accent, line: hexToRgba(fg, 0.07), wall: hexToRgba(fg, 0.5), visited: hexToRgba(fg, 0.1) };
  }

  function bucket() {
    const w = canvas.parentElement.clientWidth;
    return w < 520 ? [21, 15] : w < 900 ? [33, 17] : [49, 21];
  }

  function setup() {
    const [cols, rows] = bucket();
    const mid = (rows >> 1) | 1;
    grid = { cols, rows, walls: new Uint8Array(cols * rows), start: mid * cols + 1, goal: mid * cols + cols - 2 };
    // Keep scattering until a route exists.
    do {
      scatter(grid, random);
      clearEnds();
    } while (!search(grid, 'bfs').path.length);
    reset();
  }

  function clearEnds() {
    grid.walls[grid.start] = 0;
    grid.walls[grid.goal] = 0;
  }

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = canvas.parentElement.clientWidth;
    const cell = width / grid.cols;
    canvas.style.height = `${cell * grid.rows}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(cell * grid.rows * dpr);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.width / width, 0, 0);
    draw();
  }

  function draw() {
    if (!grid) return;
    const { cols, rows, walls, start, goal } = grid;
    const width = canvas.parentElement.clientWidth;
    const c = width / cols;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, c * rows);

    if (result) {
      ctx.fillStyle = colors.visited;
      for (let k = 0; k < shown.visited; k++) {
        const i = result.order[k];
        ctx.fillRect((i % cols) * c, Math.floor(i / cols) * c, c, c);
      }
    }

    ctx.fillStyle = colors.wall;
    for (let i = 0; i < walls.length; i++) {
      if (walls[i]) ctx.fillRect((i % cols) * c, Math.floor(i / cols) * c, c, c);
    }

    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < cols; x++) {
      ctx.moveTo(x * c, 0);
      ctx.lineTo(x * c, rows * c);
    }
    for (let y = 1; y < rows; y++) {
      ctx.moveTo(0, y * c);
      ctx.lineTo(cols * c, y * c);
    }
    ctx.stroke();

    if (result && shown.path > 1) {
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = Math.max(2, c * 0.28);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      result.path.slice(0, shown.path).forEach((i, k) => {
        const x = (i % cols) * c + c / 2;
        const y = Math.floor(i / cols) * c + c / 2;
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
    }

    const node = (i, fill) => {
      ctx.fillStyle = fill;
      const pad = c * 0.12;
      ctx.fillRect((i % cols) * c + pad, Math.floor(i / cols) * c + pad, c - pad * 2, c - pad * 2);
    };
    node(start, colors.accent);
    node(goal, colors.fg);
  }

  function reset() {
    cancelAnimationFrame(raf);
    result = null;
    shown = { visited: 0, path: 0 };
    out.visited.textContent = '—';
    out.path.textContent = '—';
    if (canvas.width) draw();
  }

  function run() {
    reset();
    result = search(grid, algo());
    out.algo.textContent = names[algo()];
    const finish = () => {
      shown = { visited: result.order.length, path: result.path.length };
      out.visited.textContent = String(result.order.length);
      out.path.textContent = result.path.length ? String(result.path.length - 1) : 'no route';
      draw();
    };
    if (reducedMotion.matches) return finish();

    // Reveal visited nodes over ~1.1s, then trace the path.
    const perFrame = Math.max(2, Math.ceil(result.order.length / 66));
    const step = () => {
      if (shown.visited < result.order.length) {
        shown.visited = Math.min(result.order.length, shown.visited + perFrame);
        out.visited.textContent = String(shown.visited);
      } else if (shown.path < result.path.length) {
        shown.path = Math.min(result.path.length, shown.path + 2);
      } else {
        return finish();
      }
      draw();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  // Drawing walls with pointer or touch.
  let paint = null;
  const cellAt = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * grid.cols);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * grid.rows);
    if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return -1;
    return y * grid.cols + x;
  };
  const applyPaint = (event) => {
    const i = cellAt(event);
    if (i < 0 || i === grid.start || i === grid.goal || grid.walls[i] === paint) return;
    grid.walls[i] = paint;
    if (result) reset();
    else draw();
  };
  canvas.addEventListener('pointerdown', (event) => {
    const i = cellAt(event);
    if (i < 0) return;
    paint = grid.walls[i] ? 0 : 1;
    canvas.setPointerCapture(event.pointerId);
    applyPaint(event);
  });
  canvas.addEventListener('pointermove', (event) => paint !== null && applyPaint(event));
  const stop = () => (paint = null);
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);

  root.querySelector('[data-pf="run"]').addEventListener('click', run);
  root.querySelector('[data-pf="maze"]').addEventListener('click', () => {
    maze(grid, random);
    clearEnds();
    reset();
  });
  root.querySelector('[data-pf="clear"]').addEventListener('click', () => {
    grid.walls.fill(0);
    reset();
  });
  root.querySelectorAll('input[name="pf-algo"]').forEach((input) =>
    input.addEventListener('change', () => {
      out.algo.textContent = names[algo()];
      if (result) run();
    }),
  );

  readColors();
  setup();
  size();

  let lastBucket = bucket().join();
  new ResizeObserver(() => {
    const next = bucket().join();
    if (next !== lastBucket) {
      lastBucket = next;
      setup();
    }
    size();
  }).observe(canvas.parentElement);

  window.addEventListener('themechange', () => {
    readColors();
    draw();
  });

  // Run once automatically the first time the demo scrolls into view.
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        run();
      }
    },
    { threshold: 0.5 },
  );
  observer.observe(canvas);
}
