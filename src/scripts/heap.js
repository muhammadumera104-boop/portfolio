// Memory allocator sketch: a 64-unit heap with a free list, splitting and coalescing.
// A JavaScript re-creation of the idea for this page (the original study is in C).

const HEAP = 64;
const hex = (n) => `0x${n.toString(16).padStart(2, '0')}`;

export function initHeap() {
  const root = document.querySelector('[data-heap]');
  if (!root) return;
  const bar = root.querySelector('[data-heap-bar]');
  const log = root.querySelector('[data-heap-log]');
  const freeList = root.querySelector('[data-heap-free]');
  const allocButton = root.querySelector('[data-heap="alloc"]');

  let blocks;
  let newest = -1;

  const size = () => Number(root.querySelector('input[name="heap-size"]:checked').value);
  const fit = () => root.querySelector('input[name="heap-fit"]:checked').value;

  function malloc(n, strategy) {
    const candidates = blocks.filter((b) => b.free && b.size >= n);
    if (!candidates.length) return null;
    const target = strategy === 'best' ? candidates.reduce((a, b) => (b.size < a.size ? b : a)) : candidates[0];
    const index = blocks.indexOf(target);
    const used = { start: target.start, size: n, free: false };
    const rest = target.size - n;
    blocks.splice(index, 1, used, ...(rest ? [{ start: target.start + n, size: rest, free: true }] : []));
    return used;
  }

  function free(start) {
    const index = blocks.findIndex((b) => b.start === start);
    blocks[index].free = true;
    // Coalesce with free neighbours on either side.
    let merged = 0;
    let i = index;
    if (blocks[i + 1]?.free) {
      blocks[i].size += blocks[i + 1].size;
      blocks.splice(i + 1, 1);
      merged++;
    }
    if (blocks[i - 1]?.free) {
      blocks[i - 1].size += blocks[i].size;
      blocks.splice(i, 1);
      i--;
      merged++;
    }
    return { block: blocks[i], merged };
  }

  function render() {
    bar.replaceChildren(
      ...blocks.map((b) => {
        const li = document.createElement('li');
        li.style.flex = `${b.size} 1 0`;
        const el = document.createElement(b.free ? 'div' : 'button');
        el.className = `heap__block heap__block--${b.free ? 'free' : 'used'}${b.start === newest ? ' heap__block--new' : ''}`;
        el.innerHTML = `<span>${b.free ? 'free' : hex(b.start)}</span><small>${b.size}</small>`;
        if (!b.free) {
          el.type = 'button';
          el.setAttribute('aria-label', `Allocated block at ${hex(b.start)}, ${b.size} units. Select to free it.`);
          el.addEventListener('click', () => {
            const { block, merged } = free(b.start);
            newest = -1;
            log.textContent = `free(${hex(b.start)}) → ${merged ? `coalesced ${merged + 1} blocks into ${hex(block.start)} · ${block.size}` : `${b.size} units returned to the free list`}.`;
            render();
            allocButton.focus();
          });
        } else {
          el.setAttribute('aria-label', `Free block at ${hex(b.start)}, ${b.size} units`);
        }
        li.append(el);
        return li;
      }),
    );
    const holes = blocks.filter((b) => b.free);
    freeList.textContent = holes.length ? holes.map((b) => `[${hex(b.start)} · ${b.size}]`).join(' → ') : 'empty';
  }

  function reset() {
    blocks = [{ start: 0, size: HEAP, free: true }];
    // A few allocations and one free, so fragmentation is visible from the start.
    [8, 12, 4, 16].forEach((n) => malloc(n, 'first'));
    free(8);
    newest = -1;
    log.textContent = 'A 64-unit heap. Allocate blocks, then select one to free it.';
    render();
  }

  allocButton.addEventListener('click', () => {
    const n = size();
    const block = malloc(n, fit());
    if (!block) {
      const largest = Math.max(0, ...blocks.filter((b) => b.free).map((b) => b.size));
      log.textContent = `malloc(${n}) → NULL. Largest free block is ${largest} — free some blocks to make room.`;
      newest = -1;
    } else {
      newest = block.start;
      log.textContent = `malloc(${n}) → ${hex(block.start)} using ${fit() === 'best' ? 'best' : 'first'} fit.`;
    }
    render();
  });

  root.querySelector('[data-heap="reset"]').addEventListener('click', reset);
  reset();
}
