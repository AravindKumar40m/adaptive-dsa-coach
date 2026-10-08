APPROACHES = {"brute": ("O(sqrt n)", "O(1)"), "better": ("O(log n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}
EXPECT_SLOW = set()


def BRUTE_OK(args):
    return args[0] <= 10000000


def brute(n):
    r = 0
    while (r + 1) * (r + 1) <= n:
        r += 1
    return r


def better(n):
    from math import isqrt

    return isqrt(n)


def optimal(n):
    lo, hi = 0, min(n, 46341)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if mid * mid <= n:
            lo = mid
        else:
            hi = mid - 1
    return lo


def gen(rng):
    return [rng.choice([rng.randint(0, 200), rng.randint(0, 1000000), rng.randint(0, 2147483647)])]
