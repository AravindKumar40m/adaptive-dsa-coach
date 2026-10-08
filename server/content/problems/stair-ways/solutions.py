APPROACHES = {"brute": ("O(3^n)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # plain recursion is too slow for the larger tests on purpose


def BRUTE_OK(args):
    return args[0] <= 20  # only run the exponential version on small inputs


def brute(n):
    if n < 0:
        return 0
    if n == 0:
        return 1
    return brute(n - 1) + brute(n - 2) + brute(n - 3)


def better(n):
    memo = {}

    def go(k):
        if k < 0:
            return 0
        if k == 0:
            return 1
        if k not in memo:
            memo[k] = go(k - 1) + go(k - 2) + go(k - 3)
        return memo[k]

    return go(n)


def optimal(n):
    a, b, c = 1, 0, 0
    for _ in range(n):
        a, b, c = a + b + c, a, b
    return a


def gen(rng):
    return [rng.randint(1, 30)]
