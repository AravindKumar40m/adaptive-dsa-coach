APPROACHES = {"brute": ("O(min(a, b))", "O(1)"), "better": ("O(log min(a, b))", "O(1)"), "optimal": ("O(log min(a, b))", "O(log min(a, b))")}
EXPECT_SLOW = {"brute"}  # trying every divisor is slow for huge numbers, on purpose


def BRUTE_OK(args):
    return max(args) <= 5000


def brute(a, b):
    for d in range(max(a, b), 0, -1):
        if a % d == 0 and b % d == 0:
            return d


def optimal(a, b):
    if b == 0:
        return a
    return optimal(b, a % b)


def better(a, b):
    from math import gcd

    return gcd(a, b)


def gen(rng):
    a = rng.choice([rng.randint(0, 60), rng.randint(0, 1000000000)])
    b = rng.choice([rng.randint(0, 60), rng.randint(0, 1000000000)])
    if a == 0 and b == 0:
        b = 1
    return [a, b]
