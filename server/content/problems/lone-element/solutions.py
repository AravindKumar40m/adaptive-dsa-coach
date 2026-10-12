APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(log n)", "O(1)")}


def brute(pairs):
    from collections import Counter

    for value, count in Counter(pairs).items():
        if count == 1:
            return value
    return -1


def optimal(pairs):
    lo, hi = 0, len(pairs) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if mid % 2 == 1:
            mid -= 1
        if pairs[mid] == pairs[mid + 1]:
            lo = mid + 2
        else:
            hi = mid
    return pairs[lo]


def gen(rng):
    k = rng.randint(0, 5)
    values = sorted(rng.sample(range(0, 30), k + 1))
    lone = rng.randrange(k + 1)
    out = []
    for i, v in enumerate(values):
        out += [v] if i == lone else [v, v]
    return [out]
