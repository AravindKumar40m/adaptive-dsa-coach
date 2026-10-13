APPROACHES = {"brute": ("O(rows * columns * (rows + columns))", "O(rows * columns)"), "optimal": ("O(rows * columns)", "O(rows + columns)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    a = [row[:] for row in grid]
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 0:
                for k in range(cols):
                    a[r][k] = 0
                for k in range(rows):
                    a[k][c] = 0
    return sum(sum(row) for row in a)


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    bad_row = [False] * rows
    bad_col = [False] * cols
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 0:
                bad_row[r] = True
                bad_col[c] = True
    total = 0
    for r in range(rows):
        for c in range(cols):
            if not bad_row[r] and not bad_col[c]:
                total += grid[r][c]
    return total


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    return [[[0 if rng.random() < 0.09 else rng.randint(-5, 9) for _ in range(cols)] for _ in range(rows)]]
