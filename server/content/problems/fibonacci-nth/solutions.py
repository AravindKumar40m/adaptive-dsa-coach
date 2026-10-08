APPROACHES = {"brute": ("O(2^n)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # the plain recursion is exponential on purpose


def BRUTE_OK(args):
    return args[0] <= 20


def brute(n):
    if n < 2:
        return n
    return brute(n - 1) + brute(n - 2)


def better(n):
    memo = {0: 0, 1: 1}

    def go(k):
        if k not in memo:
            memo[k] = go(k - 1) + go(k - 2)
        return memo[k]

    return go(n)


def optimal(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def gen(rng):
    return [rng.randint(0, 40)]
