APPROACHES = {"brute": ("O(m * n log(m * n))", "O(m * n)"), "better": ("O(n log(m * n))", "O(1)"), "optimal": ("O(m log(m * n))", "O(1)")}


def BRUTE_OK(args):
    return args[0] * args[1] <= 20000


def brute(m, n, k):
    return sorted(i * j for i in range(1, m + 1) for j in range(1, n + 1))[k - 1]


def better(m, n, k):
    lo, hi = 1, m * n
    while lo < hi:
        mid = (lo + hi) // 2
        count = 0
        for j in range(1, n + 1):
            count += min(m, mid // j)
        if count >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo


def optimal(m, n, k):
    lo, hi = 1, m * n
    while lo < hi:
        mid = (lo + hi) // 2
        count = 0
        for i in range(1, m + 1):
            count += min(n, mid // i)
        if count >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo


def gen(rng):
    m, n = rng.randint(1, 6), rng.randint(1, 6)
    return [m, n, rng.randint(1, m * n)]
