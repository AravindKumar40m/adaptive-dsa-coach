APPROACHES = {"brute": ("O(n! * n)", "O(n)"), "optimal": ("O(n^2)", "O(n)")}


def brute(n, k):
    from itertools import islice, permutations

    arrangement = next(islice(permutations("123456789"[:n]), k - 1, None))
    return "".join(arrangement)


def optimal(n, k):
    from math import factorial

    digits = [str(d) for d in range(1, n + 1)]
    k -= 1
    out = []
    for i in range(n, 0, -1):
        index, k = divmod(k, factorial(i - 1))
        out.append(digits.pop(index))
    return "".join(out)


def gen(rng):
    from math import factorial

    n = rng.randint(1, 6)
    return [n, rng.randint(1, factorial(n))]
