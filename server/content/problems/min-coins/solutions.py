APPROACHES = {"brute": ("O(n^amount)", "O(amount)"), "better": ("O(n * amount)", "O(amount)"), "optimal": ("O(n * amount)", "O(amount)")}
EXPECT_SLOW = {"brute"}  # plain recursion is exponential on purpose


def BRUTE_OK(args):
    return args[1] <= 9 and len(args[0]) <= 4


def brute(coins, amount):
    def go(remaining):
        if remaining == 0:
            return 0
        best = -1
        for c in coins:
            if c <= remaining:
                sub = go(remaining - c)
                if sub != -1 and (best == -1 or sub + 1 < best):
                    best = sub + 1
        return best

    return go(amount)


def better(coins, amount):
    memo = {0: 0}

    def go(remaining):
        if remaining in memo:
            return memo[remaining]
        best = -1
        for c in coins:
            if c <= remaining:
                sub = go(remaining - c)
                if sub != -1 and (best == -1 or sub + 1 < best):
                    best = sub + 1
        memo[remaining] = best
        return best

    return go(amount)


def optimal(coins, amount):
    inf = amount + 1
    best = [0] + [inf] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and best[a - c] + 1 < best[a]:
                best[a] = best[a - c] + 1
    return best[amount] if best[amount] != inf else -1


def gen(rng):
    coins = rng.sample(range(1, 10), rng.randint(1, 4))
    return [coins, rng.randint(0, 30)]
