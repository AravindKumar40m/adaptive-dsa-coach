APPROACHES = {"brute": ("O(2^d * d)", "O(d)"), "optimal": ("O(n log n)", "O(n)")}


def brute(numbers):
    from itertools import combinations

    counts = {}
    for x in numbers:
        counts[x] = counts.get(x, 0) + 1
    n = len(numbers)
    values = list(counts)
    for size in range(len(values) + 1):
        for combo in combinations(values, size):
            if sum(counts[v] for v in combo) * 2 >= n:
                return size
    return 0


def optimal(numbers):
    counts = {}
    for x in numbers:
        counts[x] = counts.get(x, 0) + 1
    n = len(numbers)
    removed = 0
    picked = 0
    for c in sorted(counts.values(), reverse=True):
        if removed * 2 >= n:
            break
        removed += c
        picked += 1
    return picked


def gen(rng):
    d = rng.randint(3, 12)
    return [[rng.randint(1, d) if rng.random() < 0.5 else rng.randint(1, 2) for _ in range(rng.randint(6, 16))]]
