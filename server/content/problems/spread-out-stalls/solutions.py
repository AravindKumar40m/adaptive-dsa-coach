APPROACHES = {"brute": ("O(n * range)", "O(1)"), "optimal": ("O(n log(range))", "O(1)")}


def brute(positions, animals):
    a = sorted(positions)
    for d in range(a[-1] - a[0], 0, -1):
        placed = 1
        last = a[0]
        for p in a[1:]:
            if p - last >= d:
                placed += 1
                last = p
        if placed >= animals:
            return d
    return 0


def optimal(positions, animals):
    a = sorted(positions)

    def fits(d):
        placed = 1
        last = a[0]
        for p in a[1:]:
            if p - last >= d:
                placed += 1
                last = p
        return placed >= animals

    lo, hi = 1, a[-1] - a[0]
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if fits(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo


def gen(rng):
    n = rng.randint(2, 8)
    return [rng.sample(range(0, 30), n), rng.randint(2, n)]
