APPROACHES = {"brute": ("O(n * distinct days)", "O(n)"), "optimal": ("O(n log(max day))", "O(1)")}


def brute(bloom, m, k):
    for day in sorted(set(bloom)):
        run = 0
        bouquets = 0
        for b in bloom:
            if b <= day:
                run += 1
                if run == k:
                    bouquets += 1
                    run = 0
            else:
                run = 0
        if bouquets >= m:
            return day
    return -1


def optimal(bloom, m, k):
    if m * k > len(bloom):
        return -1

    def enough(day):
        run = 0
        bouquets = 0
        for b in bloom:
            if b <= day:
                run += 1
                if run == k:
                    bouquets += 1
                    run = 0
            else:
                run = 0
        return bouquets >= m

    lo, hi = min(bloom), max(bloom)
    while lo < hi:
        mid = (lo + hi) // 2
        if enough(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo


def gen(rng):
    n = rng.randint(3, 10)
    return [[rng.randint(1, 9) for _ in range(n)], rng.randint(1, 3), rng.randint(1, 3)]
