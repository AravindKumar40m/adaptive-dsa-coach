APPROACHES = {"brute": ("O(2^n * n)", "O(1)"), "better": ("O(n * capacity)", "O(n * capacity)"), "optimal": ("O(n * capacity)", "O(capacity)")}
EXPECT_SLOW = {"brute"}  # trying every subset is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 12


def brute(weights, values, capacity):
    n = len(weights)
    best = 0
    for mask in range(1 << n):
        weight = value = 0
        for i in range(n):
            if mask >> i & 1:
                weight += weights[i]
                value += values[i]
        if weight <= capacity:
            best = max(best, value)
    return best


def better(weights, values, capacity):
    memo = {}

    def go(i, remaining):
        if i == len(weights):
            return 0
        if (i, remaining) not in memo:
            result = go(i + 1, remaining)
            if weights[i] <= remaining:
                result = max(result, values[i] + go(i + 1, remaining - weights[i]))
            memo[(i, remaining)] = result
        return memo[(i, remaining)]

    return go(0, capacity)


def optimal(weights, values, capacity):
    best = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        for c in range(capacity, w - 1, -1):
            best[c] = max(best[c], best[c - w] + v)
    return best[capacity]


def gen(rng):
    n = rng.randint(1, 8)
    return [[rng.randint(1, 9) for _ in range(n)], [rng.randint(0, 20) for _ in range(n)], rng.randint(0, 25)]
