APPROACHES = {"brute": ("O(n log n)", "O(n)"), "better": ("O(k)", "O(1)"), "optimal": ("O(log^2 n)", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 20000


def brute(n, k):
    return int(sorted(str(x) for x in range(1, n + 1))[k - 1])


def better(n, k):
    current = 1
    for _ in range(k - 1):
        if current * 10 <= n:
            current *= 10
        else:
            while current % 10 == 9 or current + 1 > n:
                current //= 10
            current += 1
    return current


def optimal(n, k):
    def subtree(prefix):
        first, last = prefix, prefix
        total = 0
        while first <= n:
            total += min(n + 1, last + 1) - first
            first *= 10
            last = last * 10 + 9
        return total

    current = 1
    k -= 1
    while k > 0:
        size = subtree(current)
        if size <= k:
            k -= size
            current += 1
        else:
            current *= 10
            k -= 1
    return current


def gen(rng):
    n = rng.randint(1, 200)
    return [n, rng.randint(1, n)]
