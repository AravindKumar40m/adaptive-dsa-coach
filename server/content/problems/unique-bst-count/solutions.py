APPROACHES = {"brute": ("O(Catalan(n))", "O(n)"), "better": ("O(n^2)", "O(n)"), "optimal": ("O(n^2)", "O(n)")}


def BRUTE_OK(args):
    return args[0] <= 11


def brute(n):
    def count(lo, hi):
        if lo >= hi:
            return 1
        return sum(count(lo, r - 1) * count(r + 1, hi) for r in range(lo, hi + 1))

    return count(1, n)


def better(n):
    memo = {}

    def count(size):
        if size <= 1:
            return 1
        if size not in memo:
            memo[size] = sum(count(left) * count(size - 1 - left) for left in range(size))
        return memo[size]

    return count(n)


def optimal(n):
    table = [0] * (n + 2)
    table[0] = table[1] = 1
    for k in range(2, n + 1):
        for left in range(k):
            table[k] += table[left] * table[k - 1 - left]
    return table[n]


def gen(rng):
    return [rng.randint(1, 12)]
