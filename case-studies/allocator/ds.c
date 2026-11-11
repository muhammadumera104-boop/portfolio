#include "ds.h"

#include "allocator.h"

void vec_init(Vec *v) {
    v->data = NULL;
    v->length = 0;
    v->capacity = 0;
}

int vec_push(Vec *v, int value) {
    if (v->length == v->capacity) {  /* full: double the capacity (start at 4) */
        size_t bigger = v->capacity ? v->capacity * 2 : 4;
        int *grown = my_realloc(v->data, bigger * sizeof(int));
        if (!grown) return 0;        /* keep the old data intact when there is no room */
        v->data = grown;
        v->capacity = bigger;
    }
    v->data[v->length++] = value;
    return 1;
}

int vec_get(const Vec *v, size_t index, int *out) {
    if (index >= v->length) return 0;
    *out = v->data[index];
    return 1;
}

void vec_free(Vec *v) {
    my_free(v->data);
    vec_init(v);
}

void stack_init(Stack *s) {
    s->top = NULL;
    s->size = 0;
}

int stack_push(Stack *s, int value) {
    StackNode *node = my_malloc(sizeof *node);
    if (!node) return 0;
    node->value = value;
    node->below = s->top;
    s->top = node;
    s->size++;
    return 1;
}

int stack_pop(Stack *s, int *out) {
    if (!s->top) return 0;
    StackNode *node = s->top;
    *out = node->value;
    s->top = node->below;
    s->size--;
    my_free(node);
    return 1;
}

void stack_free(Stack *s) {
    int ignored;
    while (stack_pop(s, &ignored)) {
    }
}
