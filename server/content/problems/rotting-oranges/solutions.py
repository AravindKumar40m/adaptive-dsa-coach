APPROACHES = {"brute": ("O((rows*cols)^2)", "O(rows * cols)"), "optimal": ("O(rows * cols)", "O(rows * cols)")}


def brute(grid):
    g = [row[:] for row in grid]
    rows, cols = len(g), len(g[0])
    minutes = 0
    while any(1 in row for row in g):
        to_rot = []
        for r in range(rows):
            for c in range(cols):
                if g[r][c] == 1 and any(
                    0 <= r + dr < rows and 0 <= c + dc < cols and g[r + dr][c + dc] == 2
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))
                ):
                    to_rot.append((r, c))
        if not to_rot:
            return -1
        for r, c in to_rot:
            g[r][c] = 2
        minutes += 1
    return minutes


def optimal(grid):
    from collections import deque

    rows, cols = len(grid), len(grid[0])
    cells = [row[:] for row in grid]
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if cells[r][c] == 2:
                queue.append((r, c, 0))
            elif cells[r][c] == 1:
                fresh += 1
    minutes = 0
    while queue:
        r, c, t = queue.popleft()
        minutes = max(minutes, t)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and cells[nr][nc] == 1:
                cells[nr][nc] = 2
                fresh -= 1
                queue.append((nr, nc, t + 1))
    return minutes if fresh == 0 else -1


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    return [[[rng.choice([0, 1, 1, 1, 2]) for _ in range(cols)] for _ in range(rows)]]
