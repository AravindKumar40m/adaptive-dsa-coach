APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(changes):
    best = 0
    for i in range(len(changes)):
        best = max(best, sum(changes[:i + 1]))
    return best


def optimal(changes):
    best = height = 0
    for c in changes:
        height += c
        best = max(best, height)
    return best


def gen(rng):
    n = rng.randint(1, 30)
    return [[rng.randint(-20, 20) for _ in range(n)]]
