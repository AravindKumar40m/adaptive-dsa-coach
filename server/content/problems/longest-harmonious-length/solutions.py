APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    n = len(numbers)
    best = 0
    for mask in range(1, 1 << n):
        chosen = [numbers[i] for i in range(n) if mask >> i & 1]
        if max(chosen) - min(chosen) == 1:
            best = max(best, len(chosen))
    return best


def optimal(numbers):
    counts = {}
    for x in numbers:
        counts[x] = counts.get(x, 0) + 1
    best = 0
    for v, c in counts.items():
        if v + 1 in counts:
            best = max(best, c + counts[v + 1])
    return best


def gen(rng):
    return [[rng.randint(-2, 4) for _ in range(rng.randint(0, 10))]]
