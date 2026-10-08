APPROACHES = {"brute": ("O(m^n)", "O(m)"), "optimal": ("O(n log n + m log m)", "O(1)")}
EXPECT_SLOW = {"brute"}  # trying every assignment is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 6 and len(args[1]) <= 6


def brute(needs, sizes):
    used = [False] * len(sizes)

    def go(i):
        if i == len(needs):
            return 0
        best = go(i + 1)  # this child gets no cookie
        for j in range(len(sizes)):
            if not used[j] and sizes[j] >= needs[i]:
                used[j] = True
                best = max(best, 1 + go(i + 1))
                used[j] = False
        return best

    return go(0)


def optimal(needs, sizes):
    needs = sorted(needs)
    i = 0
    for c in sorted(sizes):
        if i < len(needs) and c >= needs[i]:
            i += 1
    return i


def gen(rng):
    return [[rng.randint(1, 6) for _ in range(rng.randint(1, 6))], [rng.randint(1, 6) for _ in range(rng.randint(1, 6))]]
