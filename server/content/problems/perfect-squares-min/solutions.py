APPROACHES = {"brute": ("exponential", "O(n)"), "better": ("O(n * sqrt(n))", "O(n)"), "optimal": ("O(sqrt(n))", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 22


def brute(n):
    def fewest(m):
        if m == 0:
            return 0
        best = m
        i = 1
        while i * i <= m:
            best = min(best, 1 + fewest(m - i * i))
            i += 1
        return best

    return fewest(n)


def better(n):
    best = [0] + [n] * n
    for m in range(1, n + 1):
        i = 1
        while i * i <= m:
            best[m] = min(best[m], best[m - i * i] + 1)
            i += 1
    return best[n]


def optimal(n):
    from math import isqrt

    root = isqrt(n)
    if root * root == n:
        return 1
    m = n
    while m % 4 == 0:
        m //= 4
    if m % 8 == 7:
        return 4
    i = 1
    while i * i <= n:
        rest = n - i * i
        r = isqrt(rest)
        if r * r == rest:
            return 2
        i += 1
    return 3


def gen(rng):
    return [rng.randint(1, 150)]
