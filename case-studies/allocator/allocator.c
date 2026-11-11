#include "allocator.h"

#include <stdint.h>
#include <string.h>

#define MAGIC 0xA110C8EDu

typedef struct Block {
    size_t size;          /* payload size in bytes (a multiple of ALIGNMENT)           */
    unsigned magic;       /* lets my_free reject pointers that were never returned     */
    int is_free;
    struct Block *next;   /* the block right after this one in memory                   */
    struct Block *prev;   /* the block right before it                                  */
} Block;

/* The header size is rounded up to the alignment so the payload that follows it is aligned too. */
#define HEADER ((sizeof(Block) + ALIGNMENT - 1) & ~(size_t)(ALIGNMENT - 1))
#define MIN_PAYLOAD ALIGNMENT

static _Alignas(ALIGNMENT) unsigned char arena[HEAP_SIZE];
static Block *first = NULL;

static size_t align_up(size_t n) { return (n + ALIGNMENT - 1) & ~(size_t)(ALIGNMENT - 1); }
static void *payload(Block *b) { return (unsigned char *)b + HEADER; }
static Block *header_of(void *p) { return (Block *)((unsigned char *)p - HEADER); }

void heap_init(void) {
    first = (Block *)arena;
    first->size = HEAP_SIZE - HEADER;
    first->magic = MAGIC;
    first->is_free = 1;
    first->next = NULL;
    first->prev = NULL;
}

/* Cuts a free block in two when it is bigger than needed, leaving the rest as a new free block. */
static void split(Block *b, size_t wanted) {
    if (b->size < wanted + HEADER + MIN_PAYLOAD) return;  /* the leftover would be too small to be useful */
    Block *rest = (Block *)((unsigned char *)payload(b) + wanted);
    rest->size = b->size - wanted - HEADER;
    rest->magic = MAGIC;
    rest->is_free = 1;
    rest->next = b->next;
    rest->prev = b;
    if (b->next) b->next->prev = rest;
    b->next = rest;
    b->size = wanted;
}

void *my_malloc(size_t size) {
    if (size == 0 || size > HEAP_SIZE) return NULL;
    if (!first) heap_init();
    size_t wanted = align_up(size);
    for (Block *b = first; b; b = b->next) {  /* first fit */
        if (b->is_free && b->size >= wanted) {
            split(b, wanted);
            b->is_free = 0;
            return payload(b);
        }
    }
    return NULL;
}

void *my_calloc(size_t count, size_t size) {
    if (count != 0 && size > SIZE_MAX / count) return NULL;  /* count * size would overflow */
    size_t total = count * size;
    void *p = my_malloc(total);
    if (p) memset(p, 0, total);
    return p;
}

/* Merges b with the free block after it, if there is one. */
static void merge_with_next(Block *b) {
    Block *n = b->next;
    if (n && n->is_free) {
        b->size += HEADER + n->size;
        b->next = n->next;
        if (n->next) n->next->prev = b;
        n->magic = 0;  /* the absorbed header is gone: a stale pointer to it will now be rejected */
    }
}

FreeResult my_free(void *ptr) {
    if (!ptr) return FREE_NULL;
    unsigned char *p = ptr;
    if (!first || p < arena + HEADER || p >= arena + HEAP_SIZE || ((uintptr_t)p % ALIGNMENT) != 0) return FREE_BAD_POINTER;
    Block *b = header_of(p);
    if (b->magic != MAGIC) return FREE_BAD_POINTER;
    if (b->is_free) return FREE_DOUBLE;
    b->is_free = 1;
    merge_with_next(b);                          /* coalesce forward  */
    if (b->prev && b->prev->is_free) merge_with_next(b->prev);  /* and backward: the previous block absorbs b */
    return FREE_OK;
}

void *my_realloc(void *ptr, size_t size) {
    if (!ptr) return my_malloc(size);
    if (size == 0) {
        my_free(ptr);
        return NULL;
    }
    Block *b = header_of(ptr);
    if (b->size >= align_up(size)) return ptr;  /* already big enough (shrinking keeps the block as it is) */
    void *fresh = my_malloc(size);
    if (!fresh) return NULL;                    /* the old block is untouched, like the standard realloc */
    memcpy(fresh, ptr, b->size);
    my_free(ptr);
    return fresh;
}

void heap_stats(HeapStats *out) {
    memset(out, 0, sizeof *out);
    out->heap_size = HEAP_SIZE;
    if (!first) heap_init();
    for (Block *b = first; b; b = b->next) {
        if (b->is_free) {
            out->free_blocks++;
            out->free_bytes += b->size;
            if (b->size > out->largest_free) out->largest_free = b->size;
        } else {
            out->used_blocks++;
            out->used_bytes += b->size;
        }
    }
    out->fragmentation = out->free_bytes ? 1.0 - (double)out->largest_free / (double)out->free_bytes : 0.0;
}

int heap_check(void) {
    if (!first) return 1;
    size_t total = 0;
    Block *prev = NULL;
    for (Block *b = first; b; prev = b, b = b->next) {
        if ((unsigned char *)b < arena || (unsigned char *)b >= arena + HEAP_SIZE) return 0;
        if (b->magic != MAGIC || b->prev != prev) return 0;
        if (b->size % ALIGNMENT != 0) return 0;
        if (prev && prev->is_free && b->is_free) return 0;  /* two free neighbours should have been merged */
        total += HEADER + b->size;
    }
    return total == HEAP_SIZE;  /* headers and payloads must add up to exactly the whole arena */
}

void heap_dump(FILE *out) {
    if (!first) heap_init();
    fprintf(out, "  %-6s %-6s %8s\n", "block", "state", "bytes");
    int i = 0;
    for (Block *b = first; b; b = b->next, i++) fprintf(out, "  %-6d %-6s %8zu\n", i, b->is_free ? "free" : "used", b->size);
    /* One character per 1 KiB of the arena: '#' mostly used, '.' mostly free. */
    fprintf(out, "  [");
    const size_t cell = 1024;
    for (size_t at = 0; at < HEAP_SIZE; at += cell) {
        size_t used = 0;
        for (Block *b = first; b; b = b->next) {
            size_t lo = (size_t)((unsigned char *)b - arena), hi = lo + HEADER + b->size;
            if (!b->is_free && lo < at + cell && hi > at) {
                size_t from = lo > at ? lo : at, to = hi < at + cell ? hi : at + cell;
                used += to - from;
            }
        }
        fputc(used >= cell / 2 ? '#' : '.', out);
    }
    fprintf(out, "]\n");
}
