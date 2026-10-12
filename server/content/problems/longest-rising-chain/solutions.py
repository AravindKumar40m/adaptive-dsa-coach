APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(values):
    n = len(values)
    best = [1] * n
    for i in range(n):
        for j in range(i):
            if values[j] < values[i] and best[j] + 1 > best[i]:
                best[i] = best[j] + 1
    return max(best) if best else 0


def optimal(values):
    from bisect import bisect_left

    tails = []
    for x in values:
        p = bisect_left(tails, x)
        if p == len(tails):
            tails.append(x)
        else:
            tails[p] = x
    return len(tails)


def gen(rng):
    return [[rng.randint(-5, 8) for _ in range(rng.randint(0, 14))]]
