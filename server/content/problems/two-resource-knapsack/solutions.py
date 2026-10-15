APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n * zeros * ones)", "O(zeros * ones)")}


def BRUTE_OK(args):
    return len(args[0]) <= 12


def brute(items, zeros, ones):
    n = len(items)
    best = 0
    for mask in range(1 << n):
        z = o = count = 0
        for i in range(n):
            if mask >> i & 1:
                z += items[i][0]
                o += items[i][1]
                count += 1
        if z <= zeros and o <= ones:
            best = max(best, count)
    return best


def optimal(items, zeros, ones):
    best = [[0] * (ones + 1) for _ in range(zeros + 1)]
    for zc, oc in items:
        for a in range(zeros, zc - 1, -1):
            for b in range(ones, oc - 1, -1):
                best[a][b] = max(best[a][b], best[a - zc][b - oc] + 1)
    return best[zeros][ones]


def gen(rng):
    return [[[rng.randint(0, 4), rng.randint(0, 4)] for _ in range(rng.randint(0, 8))], rng.randint(0, 8), rng.randint(0, 8)]
