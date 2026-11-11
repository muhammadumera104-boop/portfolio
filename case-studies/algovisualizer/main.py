"""AlgoVisualizer: watch path-finding algorithms work on a grid or a freshly generated maze.

    python main.py                          # compare all four algorithms on a built-in grid with mud
    python main.py --algo astar             # draw one algorithm
    python main.py --maze 15 31 --seed 4    # generate a maze, then compare the algorithms on it
    python main.py --algo astar --animate   # watch the search spread, one picture at a time
"""

from __future__ import annotations

import argparse
import sys
import time

from grid import Grid, generate_maze
from render import frames, render, summary
from search import ALGORITHMS

SAMPLE = """
...................
.........~~~.......
...###...~~~.......
S........~~~......G
.........~~~..###..
.........~~~.......
...................
"""


def sample_grid() -> tuple[Grid, tuple[int, int], tuple[int, int]]:
    """Reads S and G out of the text, and turns them into ordinary floor."""
    text = SAMPLE.strip("\n")
    start = goal = None
    for r, line in enumerate(text.splitlines()):
        for c, ch in enumerate(line):
            if ch == "S":
                start = (r, c)
            elif ch == "G":
                goal = (r, c)
    assert start and goal
    return Grid.parse(text.replace("S", ".").replace("G", ".")), start, goal


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Visualise path-finding algorithms in the terminal.")
    parser.add_argument("--algo", choices=sorted(ALGORITHMS), help="draw just this algorithm")
    parser.add_argument("--maze", nargs=2, type=int, metavar=("HEIGHT", "WIDTH"), help="generate a maze (odd sizes, at least 5)")
    parser.add_argument("--animate", action="store_true", help="play the search step by step (use with --algo)")
    parser.add_argument("--seed", type=int, help="make the maze repeatable")
    args = parser.parse_args(argv)

    try:
        if args.maze:
            grid = generate_maze(args.maze[0], args.maze[1], args.seed)
            start, goal = (1, 1), (grid.height - 2, grid.width - 2)
        else:
            grid, start, goal = sample_grid()
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    if args.animate:
        if not args.algo:
            print("error: --animate needs --algo, for example --algo astar", file=sys.stderr)
            return 2
        result = ALGORITHMS[args.algo](grid, start, goal)
        previous = 0
        for picture in frames(grid, result, start, goal):
            if previous:
                print(f"\x1b[{previous}A", end="")  # move the cursor back up and draw over the last picture
            print(picture)
            previous = len(picture.splitlines())
            time.sleep(0.05)
        print(summary(result))
        return 0

    chosen = [args.algo] if args.algo else list(ALGORITHMS)
    results = [ALGORITHMS[name](grid, start, goal) for name in chosen]
    for result in results:
        print(f"\n{summary(result)}")
        print(render(grid, result, start, goal))
    if len(results) > 1:
        print("\nSummary")
        for result in results:
            print("  " + summary(result))
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # the explored-cell dots are not plain ASCII
    raise SystemExit(main())
