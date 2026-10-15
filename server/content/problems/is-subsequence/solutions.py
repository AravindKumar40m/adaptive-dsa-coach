APPROACHES = {"brute": ("O(len(s) * len(t))", "O(len(s) * len(t))"), "optimal": ("O(len(s) + len(t))", "O(1)")}


def brute(s, t):
    m, n = len(s), len(t)
    table = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            if s[i] == t[j]:
                table[i + 1][j + 1] = table[i][j] + 1
            else:
                table[i + 1][j + 1] = max(table[i][j + 1], table[i + 1][j])
    return table[m][n] == m


def optimal(s, t):
    i = 0
    for c in t:
        if i < len(s) and s[i] == c:
            i += 1
    return i == len(s)


def gen(rng):
    t = "".join(rng.choice("abc") for _ in range(rng.randint(0, 9)))
    if rng.random() < 0.5 and t:
        s = "".join(ch for ch in t if rng.random() < 0.6)
    else:
        s = "".join(rng.choice("abc") for _ in range(rng.randint(0, 4)))
    return [s, t]
