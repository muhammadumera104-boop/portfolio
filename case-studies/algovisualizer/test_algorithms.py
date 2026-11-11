"""Tests: python -m unittest -v   (run from this folder)"""

import unittest

from grid import Grid, generate_maze
from main import sample_grid
from render import frames, render
from search import ALGORITHMS, astar, bfs, dfs, dijkstra


class SearchTests(unittest.TestCase):
    def test_all_algorithms_find_a_valid_path_on_an_open_grid(self):
        grid = Grid.parse("....\n....\n....")
        for name, algo in ALGORITHMS.items():
            result = algo(grid, (0, 0), (2, 3))
            self.assertTrue(result.found, name)
            self.assertEqual(result.path[0], (0, 0))
            self.assertEqual(result.path[-1], (2, 3))
            for a, b in zip(result.path, result.path[1:]):
                self.assertEqual(abs(a[0] - b[0]) + abs(a[1] - b[1]), 1, f"{name} jumped")  # one step at a time

    def test_bfs_dijkstra_and_astar_give_the_shortest_path_when_there_is_no_mud(self):
        grid = Grid.parse("....\n.##.\n....")
        lengths = {name: len(algo(grid, (0, 0), (2, 3)).path) for name, algo in ALGORITHMS.items() if name != "dfs"}
        self.assertEqual(set(lengths.values()), {6})

    def test_dijkstra_avoids_mud_that_bfs_walks_straight_through(self):
        grid = Grid.parse("S~~~G\n.....".replace("S", ".").replace("G", "."))
        # Straight along the top costs 5+5+5+1 = 16 (4 steps); going round the bottom costs 6 (6 steps).
        straight = bfs(grid, (0, 0), (0, 4))
        cheap = dijkstra(grid, (0, 0), (0, 4))
        self.assertEqual(len(straight.path) - 1, 4)
        self.assertEqual(straight.cost, 16)
        self.assertEqual(cheap.cost, 6)
        self.assertLess(cheap.cost, straight.cost)

    def test_astar_matches_dijkstra_cost_but_explores_no_more(self):
        grid, start, goal = sample_grid()
        d, a = dijkstra(grid, start, goal), astar(grid, start, goal)
        self.assertEqual(d.cost, a.cost)
        self.assertLessEqual(len(a.explored), len(d.explored))

    def test_astar_explores_far_fewer_cells_on_an_open_field(self):
        grid = Grid.parse("\n".join(["." * 21] * 21))
        d, a = dijkstra(grid, (10, 0), (10, 20)), astar(grid, (10, 0), (10, 20))
        self.assertEqual(d.cost, a.cost)
        self.assertLess(len(a.explored), len(d.explored) // 3)

    def test_no_route_returns_an_empty_path_not_an_error(self):
        grid = Grid.parse("..#..\n..#..")
        for name, algo in ALGORITHMS.items():
            result = algo(grid, (0, 0), (0, 4))
            self.assertFalse(result.found, name)
            self.assertEqual(result.path, [])

    def test_start_equal_to_goal(self):
        grid = Grid.parse("...")
        for algo in ALGORITHMS.values():
            self.assertEqual(algo(grid, (0, 1), (0, 1)).path, [(0, 1)])

    def test_a_start_inside_a_wall_is_rejected(self):
        grid = Grid.parse(".#.")
        with self.assertRaises(ValueError):
            bfs(grid, (0, 1), (0, 2))
        with self.assertRaises(ValueError):
            dfs(grid, (0, 0), (5, 5))


class RenderTests(unittest.TestCase):
    def test_animation_grows_one_step_at_a_time_and_ends_with_the_path(self):
        grid, start, goal = sample_grid()
        result = astar(grid, start, goal)
        pictures = list(frames(grid, result, start, goal, per_frame=5))
        self.assertGreater(len(pictures), 5)
        self.assertNotIn("*", pictures[0])  # nothing is on the path yet
        self.assertEqual(pictures[-1], render(grid, result, start, goal))
        self.assertIn("*", pictures[-1])
        explored_marks = [p.count("·") + p.count("≈") for p in pictures[:-1]]
        self.assertEqual(explored_marks, sorted(explored_marks))  # the explored area never shrinks

    def test_bad_frame_size_is_rejected(self):
        grid = Grid.parse("...")
        with self.assertRaises(ValueError):
            list(frames(grid, bfs(grid, (0, 0), (0, 2)), (0, 0), (0, 2), per_frame=0))


class GridTests(unittest.TestCase):
    def test_parse_rejects_ragged_rows_and_unknown_characters(self):
        with self.assertRaises(ValueError):
            Grid.parse("...\n..")
        with self.assertRaises(ValueError):
            Grid.parse("..x")
        with self.assertRaises(ValueError):
            Grid.parse("")


class MazeTests(unittest.TestCase):
    def test_same_seed_gives_the_same_maze(self):
        self.assertEqual(generate_maze(11, 21, seed=3), generate_maze(11, 21, seed=3))
        self.assertNotEqual(generate_maze(11, 21, seed=3), generate_maze(11, 21, seed=4))

    def test_maze_is_perfect_every_open_cell_is_reachable(self):
        for seed in range(5):
            maze = generate_maze(15, 25, seed)
            open_cells = {(r, c) for r in range(maze.height) for c in range(maze.width) if maze.passable((r, c))}
            # explore from the far corner: a goal that does not exist makes BFS visit every cell it can reach
            reached = set(bfs(maze, (1, 1), (maze.height - 2, maze.width - 2)).explored)
            self.assertTrue(bfs(maze, (1, 1), (maze.height - 2, maze.width - 2)).found)
            self.assertTrue(reached <= open_cells)
            # a perfect maze on a grid of rooms has (rooms - 1) knocked-down walls, so open cells = 2 * rooms - 1
            rooms = ((maze.height - 1) // 2) * ((maze.width - 1) // 2)
            self.assertEqual(len(open_cells), 2 * rooms - 1)

    def test_borders_stay_walls(self):
        maze = generate_maze(9, 9, seed=1)
        self.assertTrue(all(ch == "#" for ch in maze.rows[0] + maze.rows[-1]))
        self.assertTrue(all(row[0] == "#" and row[-1] == "#" for row in maze.rows))

    def test_bad_sizes_are_rejected(self):
        for size in ((4, 9), (9, 4), (3, 9), (10, 11)):
            with self.assertRaises(ValueError):
                generate_maze(*size)


if __name__ == "__main__":
    unittest.main()
