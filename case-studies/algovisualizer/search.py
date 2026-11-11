"""Four ways to find a path across a Grid: BFS, DFS, Dijkstra and A*.

Every function returns a SearchResult that records the order in which cells were explored, so a picture of
"how hard did this algorithm work" can be drawn afterwards.
"""

from __future__ import annotations

import heapq
from collections import deque
from dataclasses import dataclass, field
from typing import Callable

from grid import Cell, Grid


@dataclass
class SearchResult:
    name: str
    path: list[Cell]                                        # start to goal, empty if there is no route
    explored: list[Cell] = field(default_factory=list)      # cells in the order they were taken off the frontier
    cost: int = 0                                           # total price of the path

    @property
    def found(self) -> bool:
        return bool(self.path)


def _walk_back(came_from: dict[Cell, Cell | None], goal: Cell) -> list[Cell]:
    path: list[Cell] = []
    cell: Cell | None = goal
    while cell is not None:
        path.append(cell)
        cell = came_from[cell]
    return path[::-1]


def _path_cost(grid: Grid, path: list[Cell]) -> int:
    return sum(grid.cost(cell) for cell in path[1:])


def _check(grid: Grid, start: Cell, goal: Cell) -> None:
    for label, cell in (("start", start), ("goal", goal)):
        if not grid.passable(cell):
            raise ValueError(f"The {label} cell {cell} is outside the grid or inside a wall.")


def bfs(grid: Grid, start: Cell, goal: Cell) -> SearchResult:
    """Breadth-first: explores in rings. Fewest STEPS, but it ignores mud."""
    _check(grid, start, goal)
    came_from: dict[Cell, Cell | None] = {start: None}
    queue = deque([start])
    explored: list[Cell] = []
    while queue:
        cell = queue.popleft()
        explored.append(cell)
        if cell == goal:
            path = _walk_back(came_from, goal)
            return SearchResult("BFS", path, explored, _path_cost(grid, path))
        for n in grid.neighbours(cell):
            if n not in came_from:
                came_from[n] = cell
                queue.append(n)
    return SearchResult("BFS", [], explored)


def dfs(grid: Grid, start: Cell, goal: Cell) -> SearchResult:
    """Depth-first: dives down one corridor at a time. Finds A path, usually not the shortest."""
    _check(grid, start, goal)
    came_from: dict[Cell, Cell | None] = {start: None}
    stack = [start]
    explored: list[Cell] = []
    seen = {start}
    while stack:
        cell = stack.pop()
        explored.append(cell)
        if cell == goal:
            path = _walk_back(came_from, goal)
            return SearchResult("DFS", path, explored, _path_cost(grid, path))
        for n in reversed(grid.neighbours(cell)):  # reversed so the first neighbour is tried first
            if n not in seen:
                seen.add(n)
                came_from[n] = cell
                stack.append(n)
    return SearchResult("DFS", [], explored)


def _best_first(grid: Grid, start: Cell, goal: Cell, name: str, heuristic: Callable[[Cell], int]) -> SearchResult:
    """The loop shared by Dijkstra and A*: always expand the cell with the smallest cost-so-far plus estimate.

    With heuristic == 0 this is Dijkstra. With an estimate of the remaining distance it is A*.
    """
    _check(grid, start, goal)
    best: dict[Cell, int] = {start: 0}
    came_from: dict[Cell, Cell | None] = {start: None}
    frontier: list[tuple[int, int, Cell]] = [(heuristic(start), 0, start)]  # (priority, tie-breaker, cell)
    counter = 0
    explored: list[Cell] = []
    done: set[Cell] = set()
    while frontier:
        _, _, cell = heapq.heappop(frontier)
        if cell in done:
            continue  # an older, more expensive entry for a cell we already settled
        done.add(cell)
        explored.append(cell)
        if cell == goal:
            path = _walk_back(came_from, goal)
            return SearchResult(name, path, explored, best[goal])
        for n in grid.neighbours(cell):
            new_cost = best[cell] + grid.cost(n)
            if new_cost < best.get(n, float("inf")):
                best[n] = new_cost
                came_from[n] = cell
                counter += 1
                heapq.heappush(frontier, (new_cost + heuristic(n), counter, n))
    return SearchResult(name, [], explored)


def dijkstra(grid: Grid, start: Cell, goal: Cell) -> SearchResult:
    """Cheapest path by cost, exploring evenly in every direction."""
    return _best_first(grid, start, goal, "Dijkstra", lambda cell: 0)


def astar(grid: Grid, start: Cell, goal: Cell) -> SearchResult:
    """Cheapest path too, but it leans toward the goal, so it explores fewer cells.

    The estimate is the Manhattan distance. Every step costs at least 1, so the estimate never promises more than
    the truth ("admissible"), and that is what guarantees A* still returns the cheapest path.
    """
    gr, gc = goal
    return _best_first(grid, start, goal, "A*", lambda cell: abs(cell[0] - gr) + abs(cell[1] - gc))


ALGORITHMS = {"bfs": bfs, "dfs": dfs, "dijkstra": dijkstra, "astar": astar}
