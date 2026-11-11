"""Draws a search as text, so it works in any terminal and can be pasted into a README."""

from __future__ import annotations

from typing import Iterator

from grid import Cell, Grid
from search import SearchResult


def render(grid: Grid, result: SearchResult, start: Cell, goal: Cell, explored_marker: str = "·") -> str:
    """S = start, G = goal, * = the path, · = explored but not on the path, # = wall, ~ = mud."""
    path = set(result.path)
    explored = set(result.explored)
    lines = []
    for r, row in enumerate(grid.rows):
        chars = []
        for c, ch in enumerate(row):
            cell = (r, c)
            if cell == start:
                chars.append("S")
            elif cell == goal:
                chars.append("G")
            elif cell in path:
                chars.append("*")
            elif ch == "." and cell in explored:
                chars.append(explored_marker)
            elif ch == "~" and cell in explored:
                chars.append("≈")  # explored mud
            else:
                chars.append(ch)
        lines.append("".join(chars))
    return "\n".join(lines)


def frames(grid: Grid, result: SearchResult, start: Cell, goal: Cell, per_frame: int = 3) -> Iterator[str]:
    """The search as an animation: one picture after every `per_frame` explored cells, then the finished path."""
    if per_frame < 1:
        raise ValueError("per_frame must be at least 1.")
    for upto in range(per_frame, len(result.explored) + per_frame, per_frame):
        yield render(grid, SearchResult(result.name, [], result.explored[:upto]), start, goal)
    yield render(grid, result, start, goal)


def summary(result: SearchResult) -> str:
    if not result.found:
        return f"{result.name:<9} no route (explored {len(result.explored)} cells)"
    return f"{result.name:<9} path {len(result.path) - 1:>3} steps   cost {result.cost:>3}   explored {len(result.explored):>3} cells"
