APPROACHES = {"brute": ("O(2^(rows+cols))", "O(rows+cols)"), "better": ("O(rows * cols)", "O(rows * cols)"), "optimal": ("O(rows * cols)", "O(cols)")}
EXPECT_SLOW = {"brute"}  # plain recursion is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) + len(args[0][0]) <= 12


def brute(grid):
    rows, cols = len(grid), len(grid[0])

    def go(r, c):
        if r >= rows or c >= cols or grid[r][c] == 1:
            return 0
        if r == rows - 1 and c == cols - 1:
            return 1
        return go(r + 1, c) + go(r, c + 1)

    return go(0, 0)


def better(grid):
    rows, cols = len(grid), len(grid[0])
    paths = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                continue
            if r == 0 and c == 0:
                paths[r][c] = 1
            else:
                paths[r][c] = (paths[r - 1][c] if r > 0 else 0) + (paths[r][c - 1] if c > 0 else 0)
    return paths[rows - 1][cols - 1]


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    row = [0] * cols
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                row[c] = 0
            elif r == 0 and c == 0:
                row[c] = 1
            elif c > 0:
                row[c] += row[c - 1]
    return row[cols - 1]


def gen(rng):
    rows, cols = rng.randint(1, 6), rng.randint(1, 6)
    return [[[1 if rng.random() < 0.1 else 0 for _ in range(cols)] for _ in range(rows)]]
