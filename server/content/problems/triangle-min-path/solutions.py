APPROACHES = {"brute": ("O(2^n)", "O(n)"), "optimal": ("O(n^2)", "O(n)")}


def brute(rows):
    def go(r, j):
        if r == len(rows) - 1:
            return rows[r][j]
        return rows[r][j] + min(go(r + 1, j), go(r + 1, j + 1))

    return go(0, 0)


def optimal(rows):
    best = list(rows[-1])
    for r in range(len(rows) - 2, -1, -1):
        for j in range(len(rows[r])):
            best[j] = rows[r][j] + min(best[j], best[j + 1])
    return best[0]


def gen(rng):
    depth = rng.randint(1, 8)
    return [[[rng.randint(-9, 9) for _ in range(r + 1)] for r in range(depth)]]
