APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(1)", "O(1)")}


def brute(n, edges):
    for candidate in range(1, n + 1):
        if all(candidate in edge for edge in edges):
            return candidate


def optimal(n, edges):
    a, b = edges[0]
    c, d = edges[1]
    return a if a in (c, d) else b


def gen(rng):
    n = rng.randint(3, 8)
    center = rng.randint(1, n)
    others = [v for v in range(1, n + 1) if v != center]
    rng.shuffle(others)
    return [n, [[center, v] if rng.random() < 0.5 else [v, center] for v in others]]
