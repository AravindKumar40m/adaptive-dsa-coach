APPROACHES = {"brute": ("O(3^(rows*cols))", "O(rows * cols)"), "optimal": ("O(rows * cols)", "O(rows * cols)")}
EXPECT_SLOW = {"brute"}  # trying every path is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) * len(args[0][0]) <= 16


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows - 1][cols - 1] == 1:
        return -1
    best = [-1]
    on_path = [[False] * cols for _ in range(rows)]

    def go(r, c, steps):
        if r == rows - 1 and c == cols - 1:
            if best[0] == -1 or steps < best[0]:
                best[0] = steps
            return
        on_path[r][c] = True
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and not on_path[nr][nc]:
                go(nr, nc, steps + 1)
        on_path[r][c] = False

    go(0, 0, 0)
    return best[0]


def optimal(grid):
    from collections import deque

    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows - 1][cols - 1] == 1:
        return -1
    dist = {(0, 0): 0}
    queue = deque([(0, 0)])
    while queue:
        r, c = queue.popleft()
        if r == rows - 1 and c == cols - 1:
            return dist[(r, c)]
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in dist:
                dist[(nr, nc)] = dist[(r, c)] + 1
                queue.append((nr, nc))
    return -1


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    return [[[1 if rng.random() < 0.12 else 0 for _ in range(cols)] for _ in range(rows)]]
