/*
 * Two small data structures built on my_malloc: a growing array of ints (Vec) and a linked stack (Stack).
 * They never call the system malloc, so the allocator's own statistics show whether they leak.
 */
#ifndef DS_H
#define DS_H

#include <stddef.h>

typedef struct {
    int *data;
    size_t length;
    size_t capacity;
} Vec;

void vec_init(Vec *v);
int vec_push(Vec *v, int value);          /* 1 on success, 0 when the heap is full */
int vec_get(const Vec *v, size_t index, int *out);  /* 0 when index is out of range */
void vec_free(Vec *v);

typedef struct StackNode {
    int value;
    struct StackNode *below;
} StackNode;

typedef struct {
    StackNode *top;
    size_t size;
} Stack;

void stack_init(Stack *s);
int stack_push(Stack *s, int value);
int stack_pop(Stack *s, int *out);        /* 0 when the stack is empty */
void stack_free(Stack *s);

#endif
