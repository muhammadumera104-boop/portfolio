"""A grid of cells that the search algorithms walk over, and a maze generator that carves new grids.

The grid is a list of strings where '#' is a wall and '.' is open floor.
Moving to a neighbour costs 1, except on mud ('~') where it costs 5. That is what makes Dijkstra and plain
breadth-first search disagree, so the difference between them can actually be seen.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

Cell = tuple[int, int]  # (row, column)

WALL = "#"
FLOOR = "."
MUD = "~"
MUD_COST = 5


@dataclass(frozen=True)
class Grid:
    rows: tuple[str, ...]

    @classmethod
    def parse(cls, text: str) -> "Grid":
        lines = [line.rstrip() for line in text.strip("\n").splitlines()]
        if not lines:
            raise ValueError("The grid is empty.")
        width = len(lines[0])
        if any(len(line) != width for line in lines):
            raise ValueError("Every row must have the same length.")
        bad = {ch for line in lines for ch in line} - {WALL, FLOOR, MUD}
        if bad:
            raise ValueError(f"Unknown characters in the grid: {sorted(bad)}")
        return cls(tuple(lines))

    @property
    def height(self) -> int:
        return len(self.rows)

    @property
    def width(self) -> int:
        return len(self.rows[0])

    def inside(self, cell: Cell) -> bool:
        r, c = cell
        return 0 <= r < self.height and 0 <= c < self.width

    def passable(self, cell: Cell) -> bool:
        return self.inside(cell) and self.rows[cell[0]][cell[1]] != WALL

    def cost(self, cell: Cell) -> int:
        """The price of stepping onto this cell."""
        return MUD_COST if self.rows[cell[0]][cell[1]] == MUD else 1

    def neighbours(self, cell: Cell) -> list[Cell]:
        """Up, right, down and left, in that fixed order, so every run gives the same answer."""
        r, c = cell
        options = [(r - 1, c), (r, c + 1), (r + 1, c), (r, c - 1)]
        return [n for n in options if self.passable(n)]


def generate_maze(height: int, width: int, seed: int | None = None) -> Grid:
    """Carves a maze with the recursive backtracker (depth-first search with an explicit stack).

    Height and width should be odd: rooms sit on odd rows and columns, walls between them are knocked down.
    The result is a "perfect" maze: every open cell can reach every other, by exactly one route.
    """
    if height < 5 or width < 5 or height % 2 == 0 or width % 2 == 0:
        raise ValueError("Height and width must be odd numbers of at least 5.")
    rng = random.Random(seed)
    cells = [[WALL] * width for _ in range(height)]
    start = (1, 1)
    cells[1][1] = FLOOR
    stack = [start]
    while stack:
        r, c = stack[-1]
        options = [(r + dr, c + dc, dr, dc) for dr, dc in ((-2, 0), (0, 2), (2, 0), (0, -2))]
        options = [(nr, nc, dr, dc) for nr, nc, dr, dc in options if 0 < nr < height - 1 and 0 < nc < width - 1 and cells[nr][nc] == WALL]
        if not options:
            stack.pop()  # dead end: back up
            continue
        nr, nc, dr, dc = rng.choice(options)
        cells[r + dr // 2][c + dc // 2] = FLOOR  # knock down the wall between the two rooms
        cells[nr][nc] = FLOOR
        stack.append((nr, nc))
    return Grid(tuple("".join(row) for row in cells))
