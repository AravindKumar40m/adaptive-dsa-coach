APPROACHES = {"brute": ("O(n! * n)", "O(n)"), "better": ("O(k) pruned", "O(n)"), "optimal": ("O(2^n * n)", "O(2^n)")}


def BRUTE_OK(args):
    return args[0] <= 8


def brute(n):
    from itertools import permutations

    return sum(1 for p in permutations(range(1, n + 1)) if all(p[i] % (i + 1) == 0 or (i + 1) % p[i] == 0 for i in range(n)))


def better(n):
    used = [False] * (n + 1)

    def go(pos):
        if pos > n:
            return 1
        total = 0
        for num in range(1, n + 1):
            if not used[num] and (num % pos == 0 or pos % num == 0):
                used[num] = True
                total += go(pos + 1)
                used[num] = False
        return total

    return go(1)


def optimal(n):
    dp = [0] * (1 << n)
    dp[0] = 1
    for mask in range(1 << n):
        if dp[mask] == 0:
            continue
        pos = bin(mask).count("1") + 1
        for num in range(1, n + 1):
            bit = 1 << (num - 1)
            if not mask & bit and (num % pos == 0 or pos % num == 0):
                dp[mask | bit] += dp[mask]
    return dp[(1 << n) - 1]


def gen(rng):
    return [rng.randint(1, 8)]
