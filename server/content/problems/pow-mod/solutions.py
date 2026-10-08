APPROACHES = {"brute": ("O(exp)", "O(1)"), "better": ("O(log exp)", "O(1)"), "optimal": ("O(log exp)", "O(log exp)")}
EXPECT_SLOW = {"brute"}  # multiplying exp times is too slow for a huge exponent, on purpose


def BRUTE_OK(args):
    return args[1] <= 100000


def brute(base, exp, m):
    result = 1 % m
    for _ in range(exp):
        result = result * (base % m) % m
    return result


def optimal(base, exp, m):
    def power(e):
        if e == 0:
            return 1 % m
        half = power(e // 2)
        result = half * half % m
        if e % 2 == 1:
            result = result * (base % m) % m
        return result

    return power(exp)


def better(base, exp, m):
    return pow(base, exp, m)


def gen(rng):
    return [rng.randint(0, 50), rng.choice([rng.randint(0, 40), rng.randint(1000000, 1000000000)]), rng.randint(1, 30000)]
