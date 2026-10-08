APPROACHES = {"brute": ("O(2^n)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # trying every route is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 18


def brute(cost):
    n = len(cost)

    def go(i):  # cheapest cost to the top when about to step on step i
        if i >= n:
            return 0
        return cost[i] + min(go(i + 1), go(i + 2))

    return min(go(0), go(1))


def better(cost):
    n = len(cost)
    best = [0] * (n + 1)
    for i in range(2, n + 1):
        best[i] = min(best[i - 1] + cost[i - 1], best[i - 2] + cost[i - 2])
    return best[n]


def optimal(cost):
    prev2 = prev1 = 0
    for i in range(2, len(cost) + 1):
        prev2, prev1 = prev1, min(prev1 + cost[i - 1], prev2 + cost[i - 2])
    return prev1


def gen(rng):
    n = rng.choice([rng.randint(2, 10), rng.randint(19, 30)])
    return [[rng.randint(0, 20) for _ in range(n)]]
