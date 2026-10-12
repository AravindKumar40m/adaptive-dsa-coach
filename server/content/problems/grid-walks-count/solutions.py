APPROACHES = {"brute": ("O(4^cells)", "O(cells)"), "optimal": ("O(4^cells)", "O(cells)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])

    def walk(r, c, visited):
        if (r, c) == (rows - 1, cols - 1):
            return 1
        total = 0
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in visited:
                total += walk(nr, nc, visited | {(nr, nc)})
        return total

    return walk(0, 0, {(0, 0)})


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]

    def walk(r, c):
        if r == rows - 1 and c == cols - 1:
            return 1
        seen[r][c] = True
        total = 0
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and not seen[nr][nc]:
                total += walk(nr, nc)
        seen[r][c] = False
        return total

    return walk(0, 0)


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    grid = [[1 if rng.random() < 0.25 else 0 for _ in range(cols)] for _ in range(rows)]
    grid[0][0] = 0
    grid[rows - 1][cols - 1] = 0
    return [grid]
