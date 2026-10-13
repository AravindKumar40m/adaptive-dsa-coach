APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n) typical, O(n) worst", "O(1)")}


def brute(numbers):
    return min(numbers)


def optimal(numbers):
    lo, hi = 0, len(numbers) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if numbers[mid] > numbers[hi]:
            lo = mid + 1
        elif numbers[mid] < numbers[hi]:
            hi = mid
        else:
            hi -= 1
    return numbers[lo]


def gen(rng):
    base = rng.randint(-6, 6)
    values = sorted(base + rng.randint(0, 4) for _ in range(rng.randint(1, 9)))
    shift = rng.randint(0, len(values) - 1)
    return [values[shift:] + values[:shift]]
