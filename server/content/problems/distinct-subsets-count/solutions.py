APPROACHES = {"brute": ("O(2^n * n)", "O(2^n)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    from itertools import combinations

    found = set()
    for size in range(len(numbers) + 1):
        for combo in combinations(sorted(numbers), size):
            found.add(combo)
    return len(found)


def optimal(numbers):
    counts = {}
    for x in numbers:
        counts[x] = counts.get(x, 0) + 1
    result = 1
    for c in counts.values():
        result *= c + 1
    return result


def gen(rng):
    return [[rng.randint(0, 3) for _ in range(rng.randint(0, 9))]]
