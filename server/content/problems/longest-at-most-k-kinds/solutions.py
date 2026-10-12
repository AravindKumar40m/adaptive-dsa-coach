APPROACHES = {"brute": ("O(n^2)", "O(k)"), "optimal": ("O(n)", "O(k)")}


def brute(items, k):
    best = 0
    for i in range(len(items)):
        seen = set()
        for j in range(i, len(items)):
            seen.add(items[j])
            if len(seen) > k:
                break
            best = max(best, j - i + 1)
    return best


def optimal(items, k):
    counts = {}
    left = 0
    best = 0
    for right, x in enumerate(items):
        counts[x] = counts.get(x, 0) + 1
        while len(counts) > k:
            y = items[left]
            counts[y] -= 1
            if counts[y] == 0:
                del counts[y]
            left += 1
        best = max(best, right - left + 1)
    return best


def gen(rng):
    return [[rng.randint(0, 3) for _ in range(rng.randint(0, 12))], rng.randint(1, 3)]
