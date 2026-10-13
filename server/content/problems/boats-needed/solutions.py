APPROACHES = {"brute": ("O(2^n * n)", "O(2^n)"), "optimal": ("O(n log n)", "O(1)")}


def brute(weights, limit):
    from functools import lru_cache

    n = len(weights)

    @lru_cache(None)
    def best(mask):
        if mask == (1 << n) - 1:
            return 0
        i = 0
        while mask >> i & 1:
            i += 1
        result = 1 + best(mask | 1 << i)
        for j in range(i + 1, n):
            if not mask >> j & 1 and weights[i] + weights[j] <= limit:
                result = min(result, 1 + best(mask | 1 << i | 1 << j))
        return result

    return best(0)


def optimal(weights, limit):
    a = sorted(weights)
    light, heavy = 0, len(a) - 1
    boats = 0
    while light <= heavy:
        if a[light] + a[heavy] <= limit:
            light += 1
        heavy -= 1
        boats += 1
    return boats


def gen(rng):
    limit = rng.randint(4, 10)
    return [[rng.randint(1, limit) for _ in range(rng.randint(0, 8))], limit]
