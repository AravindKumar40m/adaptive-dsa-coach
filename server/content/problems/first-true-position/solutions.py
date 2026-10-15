APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def brute(flags):
    for i, f in enumerate(flags):
        if f == 1:
            return i
    return -1


def optimal(flags):
    lo, hi = 0, len(flags)
    while lo < hi:
        mid = (lo + hi) // 2
        if flags[mid] == 1:
            hi = mid
        else:
            lo = mid + 1
    return lo if lo < len(flags) else -1


def gen(rng):
    zeros = rng.randint(0, 8)
    ones = rng.randint(0, 6)
    return [[0] * zeros + [1] * ones]
