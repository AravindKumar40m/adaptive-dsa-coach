APPROACHES = {"brute": ("O(2^n)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # plain recursion is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 14


def brute(prizes):
    def go(i):
        if i >= len(prizes):
            return 0
        return max(go(i + 1), prizes[i] + go(i + 2))

    return go(0)


def better(prizes):
    n = len(prizes)
    best = [0] * (n + 2)
    for i in range(n - 1, -1, -1):
        best[i] = max(best[i + 1], prizes[i] + best[i + 2])
    return best[0]


def optimal(prizes):
    prev2 = prev1 = 0
    for p in prizes:
        prev2, prev1 = prev1, max(prev1, prev2 + p)
    return prev1


def gen(rng):
    n = rng.choice([rng.randint(1, 10), rng.randint(15, 30)])  # sometimes too long for the plain recursion
    return [[rng.randint(0, 20) for _ in range(n)]]
