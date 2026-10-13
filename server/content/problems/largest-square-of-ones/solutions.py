APPROACHES = {"brute": ("O(r * c * min(r, c)^3)", "O(1)"), "optimal": ("O(r * c)", "O(c)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    best = 0
    for r in range(rows):
        for c in range(cols):
            size = 1
            while r + size <= rows and c + size <= cols:
                if all(grid[i][j] == 1 for i in range(r, r + size) for j in range(c, c + size)):
                    best = max(best, size)
                size += 1
    return best * best


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    previous = [0] * (cols + 1)
    best = 0
    for r in range(rows):
        current = [0] * (cols + 1)
        for c in range(cols):
            if grid[r][c] == 1:
                current[c + 1] = 1 + min(previous[c + 1], current[c], previous[c])
                best = max(best, current[c + 1])
        previous = current
    return best * best


def gen(rng):
    rows, cols = rng.randint(1, 6), rng.randint(1, 6)
    p = rng.choice([0.6, 0.75, 0.9])
    return [[[1 if rng.random() < p else 0 for _ in range(cols)] for _ in range(rows)]]
