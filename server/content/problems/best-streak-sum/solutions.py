APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(daily):
    best = None
    for i in range(len(daily)):
        total = 0
        for j in range(i, len(daily)):
            total += daily[j]
            if best is None or total > best:
                best = total
    return best


def optimal(daily):
    current = best = daily[0]
    for x in daily[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best


def gen(rng):
    return [[rng.randint(-9, 9) for _ in range(rng.randint(1, 12))]]
