APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    return sum(x for x in numbers if numbers.count(x) == 1)


def optimal(numbers):
    counts = {}
    for x in numbers:
        counts[x] = counts.get(x, 0) + 1
    return sum(v for v, c in counts.items() if c == 1)


def gen(rng):
    return [[rng.randint(-3, 5) for _ in range(rng.randint(0, 10))]]
