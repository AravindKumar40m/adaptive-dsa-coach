APPROACHES = {"brute": ("exponential", "O(target)"), "better": ("O(len(coins) * target)", "O(len(coins) * target)"), "optimal": ("O(len(coins) * target)", "O(target)")}
EXPECT_SLOW = {"brute"}  # recursion without memory is exponential on purpose


def BRUTE_OK(args):
    return args[1] <= 25 and len(args[0]) <= 4


def brute(coins, target):
    def go(i, remaining):
        if remaining == 0:
            return 1
        if remaining < 0 or i == len(coins):
            return 0
        return go(i, remaining - coins[i]) + go(i + 1, remaining)

    return go(0, target)


def better(coins, target):
    memo = {}

    def go(i, remaining):
        if remaining == 0:
            return 1
        if remaining < 0 or i == len(coins):
            return 0
        if (i, remaining) not in memo:
            memo[(i, remaining)] = go(i, remaining - coins[i]) + go(i + 1, remaining)
        return memo[(i, remaining)]

    return go(0, target)


def optimal(coins, target):
    ways = [1] + [0] * target
    for c in coins:
        for s in range(c, target + 1):
            ways[s] += ways[s - c]
    return ways[target]


def gen(rng):
    return [rng.sample(range(1, 9), rng.randint(1, 4)), rng.randint(0, 40)]
