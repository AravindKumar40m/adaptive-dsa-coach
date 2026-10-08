APPROACHES = {"brute": ("O(n * sum)", "O(1)"), "optimal": ("O(n log(sum))", "O(1)")}
# note: each solution must be self-contained (the build stores only the function's own source code)


def brute(packages, days):
    def days_needed(capacity):
        d, load = 1, 0
        for w in packages:
            if load + w > capacity:
                d += 1
                load = 0
            load += w
        return d

    capacity = max(packages)
    while days_needed(capacity) > days:
        capacity += 1
    return capacity


def optimal(packages, days):
    def days_needed(capacity):
        d, load = 1, 0
        for w in packages:
            if load + w > capacity:
                d += 1
                load = 0
            load += w
        return d

    lo, hi = max(packages), sum(packages)
    while lo < hi:
        mid = (lo + hi) // 2
        if days_needed(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo


def gen(rng):
    n = rng.randint(1, 10)
    return [[rng.randint(1, 10) for _ in range(n)], rng.randint(1, n)]
