APPROACHES = {"brute": ("O(n * 2^n)", "O(1)"), "optimal": ("O(2^n)", "O(n)")}


def brute(weights, target):
    n = len(weights)
    count = 0
    for mask in range(1 << n):
        total = sum(weights[i] for i in range(n) if mask >> i & 1)
        if total == target:
            count += 1
    return count


def optimal(weights, target):
    n = len(weights)

    def go(i, remaining):
        if remaining < 0:
            return 0
        if i == n:
            return 1 if remaining == 0 else 0
        return go(i + 1, remaining - weights[i]) + go(i + 1, remaining)

    return go(0, target)


def gen(rng):
    return [[rng.randint(1, 8) for _ in range(rng.randint(1, 10))], rng.randint(0, 25)]
