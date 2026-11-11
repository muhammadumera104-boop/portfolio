# AlgoVisualizer: path-finding in the terminal (Python 3)

Four search algorithms on a grid, drawn as text so you can see how each one works. It also generates mazes.

```
python main.py                          # compare BFS, DFS, Dijkstra and A* on a grid with a mud band
python main.py --algo astar             # draw one algorithm
python main.py --algo astar --animate  # watch it spread, one picture at a time
python main.py --maze 15 31 --seed 4    # generate a maze, then compare the algorithms on it
python -m unittest -v                   # 15 tests
```

Python 3.10 or newer, standard library only.

## What it shows

On the built-in grid, a band of mud (`~`) costs 5 to cross and every other step costs 1:

| Algorithm | Steps | Cost | Explored |
| --- | --- | --- | --- |
| BFS | 18 | 30 | 112 |
| DFS | 24 | 24 | 25 |
| Dijkstra | 24 | 24 | 127 |
| A* | 24 | 24 | 115 |

- **BFS** finds the path with the fewest steps, but it does not know about cost, so it wades straight through the mud.
- **Dijkstra** looks at cost, so it walks round the mud: more steps, cheaper trip.
- **A\*** returns the same cheapest path as Dijkstra but leans toward the goal, so it explores fewer cells (on an open
  field the difference is large; see the tests).
- **DFS** dives down one corridor at a time. It finds *a* path, not necessarily the best one. Here it happened to be cheap.
- **Maze generation** uses the recursive backtracker (depth-first search with an explicit stack). The mazes are
  "perfect": every open cell is reachable by exactly one route. The same `--seed` always gives the same maze.

## Files

| File | What it does |
| --- | --- |
| `grid.py` | the `Grid` class, neighbours and costs, the maze generator |
| `search.py` | `bfs`, `dfs`, `dijkstra`, `astar`; Dijkstra and A* share one loop and differ only in the estimate |
| `render.py` | draws a result as text (`S` start, `G` goal, `*` path, `·` explored, `≈` explored mud) |
| `main.py` | the command line |
| `test_algorithms.py` | unit tests |

## Notes

Written as a study project with AI assistance (Claude), then run and tested. The browser version in the portfolio's
Projects section is a separate sketch of the same idea, written in JavaScript.
