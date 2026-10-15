APPROACHES = {"brute": ("O(max * n)", "O(1)"), "optimal": ("O(n log(max))", "O(1)")}


def brute(numbers, threshold):
    d = 1
    while True:
        if sum((x + d - 1) // d for x in numbers) <= threshold:
            return d
        d += 1


def optimal(numbers, threshold):
    lo, hi = 1, max(numbers)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((x + mid - 1) // mid for x in numbers) <= threshold:
            hi = mid
        else:
            lo = mid + 1
    return lo


def gen(rng):
    numbers = [rng.randint(1, 30) for _ in range(rng.randint(1, 6))]
    return [numbers, rng.randint(len(numbers), sum(numbers))]
