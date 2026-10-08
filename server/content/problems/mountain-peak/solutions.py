APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def brute(heights):
    return heights.index(max(heights))


def optimal(heights):
    lo, hi = 0, len(heights) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if heights[mid] < heights[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo


def gen(rng):
    n = rng.randint(3, 10)
    peak = rng.randint(1, n - 2)
    left = sorted(rng.sample(range(0, 20), peak))
    right = sorted(rng.sample(range(0, 20), n - 1 - peak), reverse=True)
    return [left + [20] + right]
