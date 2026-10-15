APPROACHES = {"brute": ("O(5^n)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 10


def brute(n):
    # place tiles on the first empty cell, scanning column by column (top cell first)
    shapes = [
        [(0, 0), (0, 1)],
        [(0, 0), (1, 0)],
        [(0, 0), (1, 0), (0, 1)],
        [(0, 0), (1, 0), (1, 1)],
        [(0, 0), (0, 1), (1, 1)],
        [(0, 0), (-1, 1), (0, 1)],
    ]
    filled = [[False] * n for _ in range(2)]

    def go():
        spot = None
        for c in range(n):
            for r in range(2):
                if not filled[r][c]:
                    spot = (r, c)
                    break
            if spot:
                break
        if spot is None:
            return 1
        r0, c0 = spot
        total = 0
        for shape in shapes:
            cells = [(r0 + dr, c0 + dc) for dr, dc in shape]
            if all(0 <= r < 2 and 0 <= c < n and not filled[r][c] for r, c in cells):
                for r, c in cells:
                    filled[r][c] = True
                total += go()
                for r, c in cells:
                    filled[r][c] = False
        return total

    return go() % 1000000007


def better(n):
    MOD = 1000000007
    f = [1, 1, 2]
    for i in range(3, n + 1):
        f.append((2 * f[i - 1] + f[i - 3]) % MOD)
    return f[n]


def optimal(n):
    MOD = 1000000007
    if n <= 2:
        return [1, 1, 2][n]
    a, b, c = 1, 1, 2
    for _ in range(3, n + 1):
        a, b, c = b, c, (2 * c + a) % MOD
    return c


def gen(rng):
    return [rng.randint(1, 9)]
