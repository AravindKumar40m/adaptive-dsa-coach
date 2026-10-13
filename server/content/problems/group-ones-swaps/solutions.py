APPROACHES = {"brute": ("O(n * k)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(bits):
    k = sum(bits)
    if k <= 1:
        return 0
    return min(k - sum(bits[i:i + k]) for i in range(len(bits) - k + 1))


def optimal(bits):
    k = sum(bits)
    if k <= 1:
        return 0
    window = sum(bits[:k])
    best = window
    for i in range(k, len(bits)):
        window += bits[i] - bits[i - k]
        best = max(best, window)
    return k - best


def gen(rng):
    p = rng.choice([0.3, 0.5, 0.7])
    return [[1 if rng.random() < p else 0 for _ in range(rng.randint(5, 15))]]
