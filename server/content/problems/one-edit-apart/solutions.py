APPROACHES = {"brute": ("O(n * m)", "O(n * m)"), "optimal": ("O(n)", "O(1)")}


def brute(first, second):
    n, m = len(first), len(second)
    dist = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dist[i][0] = i
    for j in range(m + 1):
        dist[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if first[i - 1] == second[j - 1] else 1
            dist[i][j] = min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost)
    return dist[n][m] == 1


def optimal(first, second):
    a, b = (first, second) if len(first) <= len(second) else (second, first)
    if len(b) - len(a) > 1:
        return False
    i = 0
    while i < len(a) and a[i] == b[i]:
        i += 1
    if i == len(a):
        return len(b) - len(a) == 1
    if len(a) == len(b):
        return a[i + 1:] == b[i + 1:]
    return a[i:] == b[i + 1:]


def gen(rng):
    base = "".join(rng.choice("abc") for _ in range(rng.randint(0, 6)))
    kind = rng.choice(["same", "replace", "insert", "delete", "two", "random"])
    s = list(base)
    if kind == "replace" and s:
        i = rng.randrange(len(s))
        s[i] = rng.choice([c for c in "abc" if c != s[i]])
    elif kind == "insert":
        s.insert(rng.randint(0, len(s)), rng.choice("abc"))
    elif kind == "delete" and s:
        del s[rng.randrange(len(s))]
    elif kind == "two":
        s.insert(rng.randint(0, len(s)), rng.choice("abc"))
        s.insert(rng.randint(0, len(s)), rng.choice("abc"))
    elif kind == "random":
        s = [rng.choice("abc") for _ in range(rng.randint(0, 6))]
    return [base, "".join(s)]
