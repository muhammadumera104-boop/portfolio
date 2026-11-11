/* Tests for the allocator and the data structures. No framework: CHECK counts and prints failures. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "allocator.h"
#include "ds.h"

static int checks = 0, failures = 0;

#define CHECK(cond)                                                      \
    do {                                                                 \
        checks++;                                                        \
        if (!(cond)) {                                                   \
            failures++;                                                  \
            printf("FAIL line %d: %s\n", __LINE__, #cond);               \
            fflush(stdout);                                              \
        }                                                                \
    } while (0)

static void test_basic_allocation(void) {
    heap_init();
    char *a = my_malloc(100), *b = my_malloc(100);
    CHECK(a && b && a != b);
    CHECK((uintptr_t)a % ALIGNMENT == 0 && (uintptr_t)b % ALIGNMENT == 0);
    memset(a, 0xAA, 100);
    memset(b, 0xBB, 100);
    CHECK(a[99] == (char)0xAA && b[0] == (char)0xBB);  /* the two blocks do not overlap */
    CHECK(my_malloc(0) == NULL);
    CHECK(heap_check());
}

static void test_free_and_reuse(void) {
    heap_init();
    void *a = my_malloc(256);
    CHECK(my_free(a) == FREE_OK);
    CHECK(my_malloc(256) == a);  /* first fit hands the same spot back */
    CHECK(heap_check());
}

static void test_coalescing_restores_one_block(void) {
    heap_init();
    void *p[6];
    for (int i = 0; i < 6; i++) p[i] = my_malloc(500);
    /* free in an awkward order: 1, 3, 5, then 0, 2, 4, so every merge direction is used */
    int order[] = {1, 3, 5, 0, 2, 4};
    for (int i = 0; i < 6; i++) CHECK(my_free(p[order[i]]) == FREE_OK);
    HeapStats s;
    heap_stats(&s);
    CHECK(s.free_blocks == 1 && s.used_blocks == 0);
    CHECK(heap_check());
    CHECK(my_malloc(HEAP_SIZE - 64) != NULL);  /* nearly the whole arena is available again */
}

static void test_fragmentation_is_visible(void) {
    heap_init();
    void *p[8];
    for (int i = 0; i < 8; i++) p[i] = my_malloc(4000);
    for (int i = 0; i < 8; i += 2) my_free(p[i]);  /* free every other block */
    HeapStats s;
    heap_stats(&s);
    CHECK(s.free_blocks >= 4);
    CHECK(s.fragmentation > 0.3);
    CHECK(my_malloc(s.free_bytes - 100) == NULL);  /* plenty of free bytes, but no hole is big enough */
    CHECK(heap_check());
}

static void test_out_of_memory_leaves_the_heap_intact(void) {
    heap_init();
    void *a = my_malloc(HEAP_SIZE / 2);
    CHECK(a != NULL);
    CHECK(my_malloc(HEAP_SIZE) == NULL);
    CHECK(my_malloc((size_t)-1) == NULL);
    CHECK(heap_check());
    CHECK(my_free(a) == FREE_OK);
}

static void test_misuse_is_reported(void) {
    heap_init();
    int local;
    void *a = my_malloc(64);
    CHECK(my_free(NULL) == FREE_NULL);
    CHECK(my_free(&local) == FREE_BAD_POINTER);
    CHECK(my_free((char *)a + 8) == FREE_BAD_POINTER);  /* inside a block, not at its start */
    CHECK(my_free(a) == FREE_OK);
    CHECK(my_free(a) == FREE_DOUBLE || my_free(a) == FREE_BAD_POINTER);  /* either way, it is not accepted */
    CHECK(heap_check());
}

static void test_calloc_and_realloc(void) {
    heap_init();
    unsigned char *z = my_calloc(10, 10);
    CHECK(z != NULL);
    for (int i = 0; i < 100; i++) CHECK(z[i] == 0);
    CHECK(my_calloc((size_t)-1, 2) == NULL);  /* the multiplication would overflow */

    char *s = my_malloc(16);
    strcpy(s, "hello allocator");
    s = my_realloc(s, 5000);
    CHECK(s && strcmp(s, "hello allocator") == 0);  /* data survives growing */
    CHECK(my_realloc(s, 0) == NULL);
    CHECK(my_realloc(NULL, 32) != NULL);
    CHECK(heap_check());
}

static void test_random_stress(void) {
    heap_init();
    enum { SLOTS = 64 };
    unsigned char *slot[SLOTS] = {0};
    size_t size[SLOTS] = {0};
    srand(12345);
    for (int step = 0; step < 20000; step++) {
        int i = rand() % SLOTS;
        if (slot[i]) {
            for (size_t k = 0; k < size[i]; k++)
                if (slot[i][k] != (unsigned char)(i + 1)) { CHECK(0 && "a block was overwritten"); return; }
            CHECK(my_free(slot[i]) == FREE_OK);
            slot[i] = NULL;
        } else {
            size_t n = 1 + (size_t)(rand() % 900);
            slot[i] = my_malloc(n);
            if (slot[i]) {
                size[i] = n;
                memset(slot[i], i + 1, n);
            }
        }
        if (step % 500 == 0 && !heap_check()) { CHECK(0 && "heap invariants broke during the stress test"); return; }
    }
    for (int i = 0; i < SLOTS; i++) if (slot[i]) my_free(slot[i]);
    HeapStats s;
    heap_stats(&s);
    CHECK(s.used_blocks == 0 && s.free_blocks == 1);
    CHECK(heap_check());
}

static void test_vec(void) {
    heap_init();
    Vec v;
    vec_init(&v);
    for (int i = 0; i < 1000; i++) CHECK(vec_push(&v, i * 3));
    int x = -1;
    CHECK(v.length == 1000 && vec_get(&v, 999, &x) && x == 2997);
    CHECK(!vec_get(&v, 1000, &x));
    vec_free(&v);
    HeapStats s;
    heap_stats(&s);
    CHECK(s.used_blocks == 0);  /* nothing leaked */
    CHECK(heap_check());
}

static void test_stack(void) {
    heap_init();
    Stack st;
    stack_init(&st);
    for (int i = 1; i <= 100; i++) CHECK(stack_push(&st, i));
    int out = 0;
    CHECK(stack_pop(&st, &out) && out == 100);  /* last in, first out */
    CHECK(stack_pop(&st, &out) && out == 99);
    stack_free(&st);
    CHECK(st.size == 0 && !stack_pop(&st, &out));
    HeapStats s;
    heap_stats(&s);
    CHECK(s.used_blocks == 0);
    CHECK(heap_check());
}

static void test_data_structures_survive_a_full_heap(void) {
    heap_init();
    Vec v;
    vec_init(&v);
    int pushed = 0;
    while (vec_push(&v, pushed)) pushed++;  /* push until the 64 KiB heap runs out */
    CHECK(pushed > 100);
    int x = 0;
    CHECK(vec_get(&v, 0, &x) && x == 0 && vec_get(&v, (size_t)pushed - 1, &x) && x == pushed - 1);  /* old data still intact */
    CHECK(heap_check());
    vec_free(&v);
}

int main(void) {
    test_basic_allocation();
    test_free_and_reuse();
    test_coalescing_restores_one_block();
    test_fragmentation_is_visible();
    test_out_of_memory_leaves_the_heap_intact();
    test_misuse_is_reported();
    test_calloc_and_realloc();
    test_random_stress();
    test_vec();
    test_stack();
    test_data_structures_survive_a_full_heap();
    printf("%d of %d checks passed\n", checks - failures, checks);
    return failures ? 1 : 0;
}
