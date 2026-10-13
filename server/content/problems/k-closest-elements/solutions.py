APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(log(n - k) + k)", "O(1)")}


def brute(numbers, k, x):
    return sorted(sorted(numbers, key=lambda v: (abs(v - x), v))[:k])


def optimal(numbers, k, x):
    lo, hi = 0, len(numbers) - k
    while lo < hi:
        mid = (lo + hi) // 2
        if x - numbers[mid] > numbers[mid + k] - x:
            lo = mid + 1
        else:
            hi = mid
    return numbers[lo:lo + k]


def gen(rng):
    n = rng.randint(1, 8)
    return [sorted(rng.randint(-6, 12) for _ in range(n)), rng.randint(1, n), rng.randint(-8, 14)]
