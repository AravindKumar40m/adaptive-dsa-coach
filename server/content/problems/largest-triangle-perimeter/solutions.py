APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n log n)", "O(1)")}


def brute(sticks):
    from itertools import combinations

    best = 0
    for a, b, c in combinations(sticks, 3):
        x, y, z = sorted((a, b, c))
        if x + y > z:
            best = max(best, a + b + c)
    return best


def optimal(sticks):
    a = sorted(sticks, reverse=True)
    for i in range(len(a) - 2):
        if a[i + 1] + a[i + 2] > a[i]:
            return a[i] + a[i + 1] + a[i + 2]
    return 0


def gen(rng):
    return [[rng.randint(1, 12) for _ in range(rng.randint(0, 8))]]
