APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def brute(ids, new_id):
    for i, x in enumerate(ids):
        if x >= new_id:
            return i
    return len(ids)


def optimal(ids, new_id):
    lo, hi = 0, len(ids)
    while lo < hi:
        mid = (lo + hi) // 2
        if ids[mid] < new_id:
            lo = mid + 1
        else:
            hi = mid
    return lo


def gen(rng):
    n = rng.randint(1, 15)
    return [sorted(rng.randint(-10, 20) for _ in range(n)), rng.randint(-12, 22)]
