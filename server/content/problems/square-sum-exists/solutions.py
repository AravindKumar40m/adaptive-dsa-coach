APPROACHES = {"brute": ("O(c)", "O(1)"), "better": ("O(sqrt(c))", "O(1)"), "optimal": ("O(sqrt(c))", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 400


def brute(c):
    a = 0
    while a * a <= c:
        b = 0
        while b * b <= c:
            if a * a + b * b == c:
                return True
            b += 1
        a += 1
    return False


def better(c):
    from math import isqrt

    for a in range(isqrt(c) + 1):
        rest = c - a * a
        r = isqrt(rest)
        if r * r == rest:
            return True
    return False


def optimal(c):
    from math import isqrt

    a, b = 0, isqrt(c)
    while a <= b:
        s = a * a + b * b
        if s == c:
            return True
        if s < c:
            a += 1
        else:
            b -= 1
    return False


def gen(rng):
    return [rng.randint(0, 120)]
