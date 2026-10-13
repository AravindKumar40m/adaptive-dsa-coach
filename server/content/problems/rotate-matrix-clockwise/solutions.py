APPROACHES = {"brute": ("O(n^2)", "O(n^2)"), "optimal": ("O(n^2)", "O(1)")}


def brute(grid):
    n = len(grid)
    return [grid[n - 1 - c][r] for r in range(n) for c in range(n)]


def optimal(grid):
    a = [row[:] for row in grid]
    n = len(a)
    for i in range(n):
        for j in range(i + 1, n):
            a[i][j], a[j][i] = a[j][i], a[i][j]
    for row in a:
        row.reverse()
    return [x for row in a for x in row]


def gen(rng):
    n = rng.randint(1, 5)
    return [[[rng.randint(0, 99) for _ in range(n)] for _ in range(n)]]
