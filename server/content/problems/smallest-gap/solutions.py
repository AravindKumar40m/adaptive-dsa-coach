APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n log n)", "O(n)")}


def brute(finish_times):
    best = None
    for i in range(len(finish_times)):
        for j in range(i + 1, len(finish_times)):
            d = abs(finish_times[i] - finish_times[j])
            if best is None or d < best:
                best = d
    return best


def optimal(finish_times):
    ordered = sorted(finish_times)
    best = ordered[1] - ordered[0]
    for i in range(2, len(ordered)):
        best = min(best, ordered[i] - ordered[i - 1])
    return best


def gen(rng):
    n = rng.randint(2, 15)
    return [[rng.randint(0, 60) for _ in range(n)]]
