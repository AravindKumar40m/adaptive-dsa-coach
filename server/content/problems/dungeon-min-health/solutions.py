APPROACHES = {"brute": ("O(2^(r+c))", "O(r + c)"), "optimal": ("O(r * c)", "O(c)")}


def BRUTE_OK(args):
    return len(args[0]) + len(args[0][0]) <= 12


def brute(dungeon):
    rows, cols = len(dungeon), len(dungeon[0])

    def go(r, c, prefix, lowest):
        prefix += dungeon[r][c]
        lowest = min(lowest, prefix)
        if r == rows - 1 and c == cols - 1:
            return max(1, 1 - lowest)
        options = []
        if r + 1 < rows:
            options.append(go(r + 1, c, prefix, lowest))
        if c + 1 < cols:
            options.append(go(r, c + 1, prefix, lowest))
        return min(options)

    return go(0, 0, 0, 0)


def optimal(dungeon):
    rows, cols = len(dungeon), len(dungeon[0])
    INF = 10 ** 9
    need = [INF] * (cols + 1)
    need[cols - 1] = 1
    for r in range(rows - 1, -1, -1):
        for c in range(cols - 1, -1, -1):
            next_need = need[c] if r < rows - 1 else INF
            if c + 1 < cols:
                next_need = min(next_need, need[c + 1])
            if r == rows - 1 and c == cols - 1:
                next_need = 1
            need[c] = max(1, next_need - dungeon[r][c])
    return need[0]


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    return [[[rng.randint(-8, 8) for _ in range(cols)] for _ in range(rows)]]
