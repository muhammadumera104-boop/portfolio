/* A short walk through the allocator: allocate, free in an awkward order, and watch the holes merge. */
#include <stdio.h>

#include "allocator.h"

static void show(const char *title) {
    HeapStats s;
    heap_stats(&s);
    printf("\n%s\n", title);
    heap_dump(stdout);
    printf("  used %zu B in %zu block(s)  |  free %zu B in %zu block(s)\n", s.used_bytes, s.used_blocks, s.free_bytes, s.free_blocks);
    printf("  largest hole %zu B  |  fragmentation %.0f%%  |  heap check %s\n", s.largest_free, s.fragmentation * 100, heap_check() ? "ok" : "BROKEN");
}

int main(void) {
    heap_init();
    show("1. A fresh heap: one big free block");

    void *a = my_malloc(4000), *b = my_malloc(8000), *c = my_malloc(2000), *d = my_malloc(16000), *e = my_malloc(1000), *f = my_malloc(24000);
    show("2. Six allocations (4000, 8000, 2000, 16000, 1000 and 24000 bytes)");

    my_free(b);
    my_free(d);
    show("3. Free the 2nd and 4th: holes with live blocks between them (fragmentation)");

    void *big = my_malloc(20000);
    printf("\n4. Ask for 20000 bytes: %s\n", big ? "got it" : "NULL: over 34000 bytes are free, but no single hole is big enough");

    my_free(c);
    show("5. Free the 3rd block: it merges with the holes on both sides (coalescing)");

    big = my_malloc(20000);
    printf("\n6. Ask for 20000 bytes again: %s\n", big ? "got it, the merged hole is big enough" : "NULL");

    printf("\n7. Misuse is reported, not fatal:\n");
    printf("   free(a) first time: %s\n", my_free(a) == FREE_OK ? "ok" : "error");
    printf("   free(a) again:      %s\n", my_free(a) == FREE_DOUBLE ? "double free detected" : "not detected");
    int local = 0;
    printf("   free(&local):       %s\n", my_free(&local) == FREE_BAD_POINTER ? "bad pointer rejected" : "not detected");

    my_free(e);
    my_free(f);
    my_free(big);
    show("8. Everything freed: back to one block");
    return 0;
}
