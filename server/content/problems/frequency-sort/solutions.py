APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(numbers):
    return sorted(numbers, key=lambda x: (-numbers.count(x), x))


def optimal(numbers):
    counts = {}
    for x in numbers:
        counts[x] = counts.get(x, 0) + 1
    out = []
    for v in sorted(counts, key=lambda v: (-counts[v], v)):
        out += [v] * counts[v]
    return out


def gen(rng):
    return [[rng.randint(-3, 4) for _ in range(rng.randint(0, 12))]]
