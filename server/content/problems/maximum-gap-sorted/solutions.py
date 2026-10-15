APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    a = sorted(numbers)
    return max((a[i + 1] - a[i] for i in range(len(a) - 1)), default=0)


def optimal(numbers):
    n = len(numbers)
    if n < 2:
        return 0
    low, high = min(numbers), max(numbers)
    if low == high:
        return 0
    size = max(1, (high - low) // (n - 1))
    count = (high - low) // size + 1
    mins = [None] * count
    maxs = [None] * count
    for x in numbers:
        b = (x - low) // size
        if mins[b] is None or x < mins[b]:
            mins[b] = x
        if maxs[b] is None or x > maxs[b]:
            maxs[b] = x
    previous = low
    best = 0
    for b in range(count):
        if mins[b] is None:
            continue
        best = max(best, mins[b] - previous)
        previous = maxs[b]
    return best


def gen(rng):
    return [[rng.randint(0, rng.choice([10, 100, 1000])) for _ in range(rng.randint(0, 9))]]
