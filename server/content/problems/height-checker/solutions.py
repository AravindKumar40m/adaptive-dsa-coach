APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n + maxHeight)", "O(maxHeight)")}


def brute(heights):
    ordered = sorted(heights)
    return sum(1 for a, b in zip(heights, ordered) if a != b)


def optimal(heights):
    counts = [0] * (max(heights) + 1)
    for h in heights:
        counts[h] += 1
    mismatches = 0
    value = 0
    for h in heights:
        while counts[value] == 0:
            value += 1
        if h != value:
            mismatches += 1
        counts[value] -= 1
    return mismatches


def gen(rng):
    return [[rng.randint(1, 6) for _ in range(rng.randint(1, 12))]]
