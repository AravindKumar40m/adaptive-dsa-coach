APPROACHES = {"brute": ("O(3^(n+m))", "O(n + m)"), "better": ("O(n * m)", "O(n * m)"), "optimal": ("O(n * m)", "O(m)")}
EXPECT_SLOW = {"brute"}  # plain recursion is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 7 and len(args[1]) <= 7


def brute(source, target):
    def go(i, j):
        if i == len(source):
            return len(target) - j
        if j == len(target):
            return len(source) - i
        if source[i] == target[j]:
            return go(i + 1, j + 1)
        return 1 + min(go(i + 1, j), go(i, j + 1), go(i + 1, j + 1))

    return go(0, 0)


def better(source, target):
    memo = {}

    def go(i, j):
        if i == len(source):
            return len(target) - j
        if j == len(target):
            return len(source) - i
        if (i, j) not in memo:
            if source[i] == target[j]:
                memo[(i, j)] = go(i + 1, j + 1)
            else:
                memo[(i, j)] = 1 + min(go(i + 1, j), go(i, j + 1), go(i + 1, j + 1))
        return memo[(i, j)]

    import sys

    sys.setrecursionlimit(10000)
    return go(0, 0)


def optimal(source, target):
    previous = list(range(len(target) + 1))
    for i in range(1, len(source) + 1):
        current = [i] + [0] * len(target)
        for j in range(1, len(target) + 1):
            if source[i - 1] == target[j - 1]:
                current[j] = previous[j - 1]
            else:
                current[j] = 1 + min(previous[j], current[j - 1], previous[j - 1])
        previous = current
    return previous[-1]


def gen(rng):
    def word():
        return "".join(rng.choice("abc") for _ in range(rng.choice([rng.randint(0, 6), rng.randint(8, 12)])))

    return [word(), word()]
