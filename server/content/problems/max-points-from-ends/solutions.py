APPROACHES = {"brute": ("O(k^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(cards, k):
    n = len(cards)
    best = 0
    for front in range(k + 1):
        back = k - front
        best = max(best, sum(cards[:front]) + sum(cards[n - back:]))
    return best


def optimal(cards, k):
    n = len(cards)
    size = n - k
    window = sum(cards[:size])
    smallest = window
    for i in range(size, n):
        window += cards[i] - cards[i - size]
        smallest = min(smallest, window)
    return sum(cards) - smallest


def gen(rng):
    n = rng.randint(0, 9)
    return [[rng.randint(1, 9) for _ in range(n)], rng.randint(0, n)]
