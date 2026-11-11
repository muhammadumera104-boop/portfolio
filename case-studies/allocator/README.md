# Custom memory allocator and data-structure toolkit in C

A small replacement for `malloc` and `free` built on one fixed 64 KiB block of memory, plus a growing array and a
linked stack that use it. The goal was to understand what really happens behind `malloc()` and `free()`.

```
gcc -std=c11 -Wall -Wextra -Wpedantic -o demo demo.c allocator.c && ./demo
gcc -std=c11 -Wall -Wextra -Wpedantic -o tests tests.c allocator.c ds.c && ./tests    # 11,234 checks
```

## How it works

- The heap is a static array. Every chunk starts with a **header** (size, free flag, a magic number and two pointers).
- Headers form a **doubly linked list in address order**, so a block's list neighbours are its physical neighbours.
- `my_malloc` uses **first fit**: the first free block that is big enough. A block that is much bigger than needed is
  **split**, and the rest becomes a new free block.
- `my_free` marks the block free and **coalesces**: it merges with a free block after it and a free block before it,
  so neighbouring holes become one big hole.
- Sizes are rounded up to 16 bytes, so every pointer is 16-byte aligned.
- Mistakes are reported instead of corrupting memory: freeing `NULL`, a pointer that was never returned, a pointer into
  the middle of a block, or the same block twice gives a `FreeResult` error code.
- `heap_check()` verifies the invariants (list links, alignment, headers plus payloads add up to the whole arena, no two
  free blocks side by side). The tests call it after almost every step.
- `my_calloc` guards against `count * size` overflowing, and `my_realloc` leaves the old block untouched when it cannot grow.

## What the demo shows

Six allocations, then two frees leave holes with live blocks between them. Over 34,000 bytes are free, yet a request
for 20,000 bytes fails because no single hole is big enough. That is **fragmentation**. Freeing the block in the middle
merges three holes into one and the same request succeeds.

## The toolkit (`ds.c`)

- `Vec`: a growing array of `int` that doubles its capacity with `my_realloc`.
- `Stack`: a linked stack, one `my_malloc` node per element.

Neither uses the system `malloc`, so the allocator's statistics prove they do not leak: after `vec_free` and
`stack_free` the heap has zero used blocks.

## Limits (it is a study project)

First fit is simple but not the fastest: every `my_malloc` walks the list. It is not thread-safe, the heap cannot grow, and
there is no `mmap` for large blocks. A real allocator such as glibc's uses size-segregated free lists and per-thread arenas.

## Files

| File | What it does |
| --- | --- |
| `allocator.h`, `allocator.c` | the allocator and its statistics and checker |
| `ds.h`, `ds.c` | `Vec` and `Stack` built on the allocator |
| `demo.c` | the walk-through above |
| `tests.c` | tests, including a 20,000-step random stress test that checks no block is overwritten |

Written as a study project with AI assistance (Claude), then compiled with warnings on and tested.
