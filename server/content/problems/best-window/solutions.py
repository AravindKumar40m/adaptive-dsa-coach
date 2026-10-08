APPROACHES = {"brute": ("O(n*k)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(profits, k):
    best = None
    for i in range(len(profits) - k + 1):
        total = sum(profits[i:i + k])
        if best is None or total > best:
            best = total
    return best


def optimal(profits, k):
    window = sum(profits[:k])
    best = window
    for i in range(k, len(profits)):
        window += profits[i] - profits[i - k]
        best = max(best, window)
    return best


def gen(rng):
    n = rng.randint(1, 20)
    return [[rng.randint(-10, 10) for _ in range(n)], rng.randint(1, n)]
