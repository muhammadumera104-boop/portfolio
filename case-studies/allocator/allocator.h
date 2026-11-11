/*
 * A small heap allocator: my_malloc / my_free on top of one fixed block of memory.
 *
 * How it works
 *   - The heap is a static array. Every chunk of it starts with a Block header (size, free flag, neighbours).
 *   - Blocks form a doubly linked list in address order, so the neighbours of a block are always its
 *     physical neighbours in memory. That is what makes coalescing cheap.
 *   - my_malloc uses first fit: the first free block that is big enough. If it is much bigger than needed it is split.
 *   - my_free marks the block free and merges it with a free neighbour on each side (coalescing).
 */
#ifndef ALLOCATOR_H
#define ALLOCATOR_H

#include <stddef.h>
#include <stdio.h>

#define HEAP_SIZE (64 * 1024)
#define ALIGNMENT 16

typedef struct {
    size_t heap_size;      /* total bytes in the arena                                  */
    size_t used_bytes;     /* payload bytes handed out to callers                        */
    size_t free_bytes;     /* payload bytes available (not counting headers)             */
    size_t largest_free;   /* the biggest single allocation that would succeed           */
    size_t used_blocks;
    size_t free_blocks;
    double fragmentation;  /* 1 - largest_free / free_bytes: 0 = one big hole, near 1 = many small holes */
} HeapStats;

typedef enum { FREE_OK = 0, FREE_NULL, FREE_BAD_POINTER, FREE_DOUBLE } FreeResult;

void heap_init(void);                         /* resets the whole heap to one big free block */
void *my_malloc(size_t size);                 /* NULL when size is 0 or nothing fits         */
void *my_calloc(size_t count, size_t size);   /* zeroed memory; NULL on overflow or no room  */
void *my_realloc(void *ptr, size_t size);     /* grows or shrinks; may move the data         */
FreeResult my_free(void *ptr);                /* reports misuse instead of corrupting the heap */

void heap_stats(HeapStats *out);
int heap_check(void);                         /* 1 if every internal invariant holds, else 0 */
void heap_dump(FILE *out);                    /* prints the block list and a one-line picture */

#endif
