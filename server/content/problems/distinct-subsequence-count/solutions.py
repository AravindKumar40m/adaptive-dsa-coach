APPROACHES = {"brute": ("O(2^n)", "O(n)"), "better": ("O(n * m)", "O(n * m)"), "optimal": ("O(n * m)", "O(m)")}


def BRUTE_OK(args):
    return len(args[0]) <= 14


def brute(s, t):
    def go(i, j):
        if j == len(t):
            return 1
        if i == len(s):
            return 0
        total = go(i + 1, j)
        if s[i] == t[j]:
            total += go(i + 1, j + 1)
        return total

    return go(0, 0)


def better(s, t):
    n, m = len(s), len(t)
    ways = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        ways[i][0] = 1
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            ways[i][j] = ways[i - 1][j] + (ways[i - 1][j - 1] if s[i - 1] == t[j - 1] else 0)
    return ways[n][m]


def optimal(s, t):
    m = len(t)
    ways = [1] + [0] * m
    for ch in s:
        for j in range(m, 0, -1):
            if ch == t[j - 1]:
                ways[j] += ways[j - 1]
    return ways[m]


def gen(rng):
    return ["".join(rng.choice("ab") for _ in range(rng.randint(0, 9))), "".join(rng.choice("ab") for _ in range(rng.randint(0, 3)))]
