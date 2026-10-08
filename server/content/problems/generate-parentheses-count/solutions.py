APPROACHES = {"brute": ("O(4^n * n)", "O(n)"), "better": ("O(n^2)", "O(n^2)"), "optimal": ("O(n^2)", "O(n)")}
EXPECT_SLOW = {"brute"}  # checking every bracket string is exponential on purpose


def BRUTE_OK(args):
    return args[0] <= 7


def brute(n):
    from itertools import product

    count = 0
    for chars in product("()", repeat=2 * n):
        depth = 0
        for c in chars:
            depth += 1 if c == "(" else -1
            if depth < 0:
                break
        else:
            if depth == 0:
                count += 1
    return count


def better(n):
    memo = {}

    def go(opens_left, closes_left):
        if opens_left == 0 and closes_left == 0:
            return 1
        if (opens_left, closes_left) not in memo:
            total = 0
            if opens_left > 0:
                total += go(opens_left - 1, closes_left + 1)
            if closes_left > 0:
                total += go(opens_left, closes_left - 1)
            memo[(opens_left, closes_left)] = total
        return memo[(opens_left, closes_left)]

    return go(n, 0)


def optimal(n):
    ways = [1] + [0] * n
    for total in range(1, n + 1):
        ways[total] = sum(ways[i] * ways[total - 1 - i] for i in range(total))
    return ways[n]


def gen(rng):
    return [rng.randint(0, 12)]
