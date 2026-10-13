APPROACHES = {"brute": ("O(A(m, n))", "O(A(m, n))"), "optimal": ("O(1)", "O(1)")}


def brute(m, n):
    if m == 0:
        return n + 1
    if n == 0:
        return brute(m - 1, 1)
    return brute(m - 1, brute(m, n - 1))


def optimal(m, n):
    if m == 0:
        return n + 1
    if m == 1:
        return n + 2
    if m == 2:
        return 2 * n + 3
    return 2 ** (n + 3) - 3


def gen(rng):
    m = rng.randint(0, 3)
    return [m, rng.randint(0, 5 if m == 3 else 6)]
