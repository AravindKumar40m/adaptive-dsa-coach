APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(jumps):
    n = len(jumps)
    reachable = [False] * n
    reachable[0] = True
    for i in range(n):
        if reachable[i]:
            for step in range(1, jumps[i] + 1):
                if i + step < n:
                    reachable[i + step] = True
    return reachable[n - 1]


def optimal(jumps):
    farthest = 0
    for i, jump in enumerate(jumps):
        if i > farthest:
            return False
        farthest = max(farthest, i + jump)
    return True


def gen(rng):
    return [[rng.randint(0, 3) for _ in range(rng.randint(1, 10))]]
