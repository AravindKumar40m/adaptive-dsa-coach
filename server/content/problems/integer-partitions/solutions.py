APPROACHES = {"brute": ("exponential", "O(n)"), "better": ("O(n^2)", "O(n^2)"), "optimal": ("O(n^2)", "O(n)")}
EXPECT_SLOW = {"brute"}  # plain recursion without memory is exponential on purpose


def BRUTE_OK(args):
    return args[0] <= 30


def brute(n):
    def count(total, biggest):
        if total == 0:
            return 1
        if total < 0 or biggest == 0:
            return 0
        return count(total - biggest, biggest) + count(total, biggest - 1)

    return count(n, n)


def better(n):
    memo = {}

    def count(total, biggest):
        if total == 0:
            return 1
        if total < 0 or biggest == 0:
            return 0
        if (total, biggest) not in memo:
            memo[(total, biggest)] = count(total - biggest, biggest) + count(total, biggest - 1)
        return memo[(total, biggest)]

    return count(n, n)


def optimal(n):
    ways = [1] + [0] * n
    for part in range(1, n + 1):
        for s in range(part, n + 1):
            ways[s] += ways[s - part]
    return ways[n]


def gen(rng):
    return [rng.randint(1, 60)]
