APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def brute(values, target):
    return values.count(target)


def optimal(values, target):
    def first(x):
        lo, hi = 0, len(values)
        while lo < hi:
            mid = (lo + hi) // 2
            if values[mid] >= x:
                hi = mid
            else:
                lo = mid + 1
        return lo

    return first(target + 1) - first(target)


def gen(rng):
    values = sorted(rng.randint(-3, 4) for _ in range(rng.randint(0, 12)))
    target = rng.choice(values) if values and rng.random() < 0.75 else rng.randint(-4, 5)
    return [values, target]
