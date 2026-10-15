APPROACHES = {"brute": ("O(n * min(a, b))", "O(1)"), "better": ("O(a + b)", "O(a + b)"), "optimal": ("O(log(n * min(a, b)))", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 5000 and args[1] <= 50 and args[2] <= 50


def brute(n, a, b):
    count = 0
    x = 0
    while count < n:
        x += 1
        if x % a == 0 or x % b == 0:
            count += 1
    return x % 1000000007


def better(n, a, b):
    from math import gcd

    lcm = a * b // gcd(a, b)
    per_period = lcm // a + lcm // b - 1
    multiples = sorted(set(range(a, lcm + 1, a)) | set(range(b, lcm + 1, b)))
    q, r = divmod(n, per_period)
    if r == 0:
        q -= 1
        r = per_period
    return (q * lcm + multiples[r - 1]) % 1000000007


def optimal(n, a, b):
    from math import gcd

    lcm = a * b // gcd(a, b)
    lo, hi = min(a, b), n * min(a, b)
    while lo < hi:
        mid = (lo + hi) // 2
        if mid // a + mid // b - mid // lcm >= n:
            hi = mid
        else:
            lo = mid + 1
    return lo % 1000000007


def gen(rng):
    return [rng.randint(1, 60), rng.randint(1, 9), rng.randint(1, 9)]
