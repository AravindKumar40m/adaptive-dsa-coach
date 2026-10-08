APPROACHES = {"brute": ("exponential", "O(n + m)"), "better": ("O(n * m)", "O(n * m)"), "optimal": ("O(n * m)", "O(n * m)")}
EXPECT_SLOW = {"brute"}  # plain recursion branches a lot on '*', on purpose


def BRUTE_OK(args):
    return len(args[0]) + len(args[1]) <= 12


def brute(text, pattern):
    def go(i, j):
        if j == len(pattern):
            return i == len(text)
        if pattern[j] == "*":
            return go(i, j + 1) or (i < len(text) and go(i + 1, j))
        return i < len(text) and (pattern[j] == "?" or pattern[j] == text[i]) and go(i + 1, j + 1)

    return go(0, 0)


def better(text, pattern):
    memo = {}

    def go(i, j):
        if j == len(pattern):
            return i == len(text)
        if (i, j) not in memo:
            if pattern[j] == "*":
                memo[(i, j)] = go(i, j + 1) or (i < len(text) and go(i + 1, j))
            else:
                memo[(i, j)] = i < len(text) and (pattern[j] == "?" or pattern[j] == text[i]) and go(i + 1, j + 1)
        return memo[(i, j)]

    return bool(go(0, 0))


def optimal(text, pattern):
    n, m = len(text), len(pattern)
    ok = [[False] * (m + 1) for _ in range(n + 1)]
    ok[0][0] = True
    for j in range(1, m + 1):
        if pattern[j - 1] == "*":
            ok[0][j] = ok[0][j - 1]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if pattern[j - 1] == "*":
                ok[i][j] = ok[i][j - 1] or ok[i - 1][j]
            else:
                ok[i][j] = ok[i - 1][j - 1] and pattern[j - 1] in ("?", text[i - 1])
    return ok[n][m]


def gen(rng):
    text = "".join(rng.choice("ab") for _ in range(rng.randint(0, 6)))
    if rng.random() < 0.6:
        pattern = "".join(rng.choice([c, c, "?"]) for c in text)
        if pattern and rng.random() < 0.7:  # swap a stretch of the pattern for a *
            i = rng.randrange(len(pattern))
            j = rng.randint(i, len(pattern))
            pattern = pattern[:i] + "*" + pattern[j:]
    else:
        pattern = "".join(rng.choice("ab?*") for _ in range(rng.randint(0, 6)))
    return [text, pattern]
