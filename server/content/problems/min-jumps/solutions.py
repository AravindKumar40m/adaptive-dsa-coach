APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(jumps):
    n = len(jumps)
    best = [None] * n
    best[0] = 0
    for i in range(n):
        if best[i] is None:
            continue
        for step in range(1, jumps[i] + 1):
            j = i + step
            if j < n and (best[j] is None or best[i] + 1 < best[j]):
                best[j] = best[i] + 1
    return best[n - 1]


def optimal(jumps):
    jumps_used = range_end = farthest = 0
    for i in range(len(jumps) - 1):
        farthest = max(farthest, i + jumps[i])
        if i == range_end:
            jumps_used += 1
            range_end = farthest
    return jumps_used


def _reachable(jumps):
    farthest = 0
    for i, jump in enumerate(jumps):
        if i > farthest:
            return False
        farthest = max(farthest, i + jump)
    return True


def gen(rng):
    while True:
        jumps = [rng.randint(0, 4) for _ in range(rng.randint(1, 10))]
        if _reachable(jumps):
            return [jumps]
