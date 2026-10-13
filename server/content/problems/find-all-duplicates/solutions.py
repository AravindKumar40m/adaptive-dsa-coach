APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    from collections import Counter

    return sorted(v for v, c in Counter(numbers).items() if c == 2)


def optimal(numbers):
    a = list(numbers)
    out = []
    for x in a:
        i = abs(x) - 1
        if a[i] < 0:
            out.append(abs(x))
        else:
            a[i] = -a[i]
    return sorted(out)


def gen(rng):
    n = rng.randint(1, 9)
    k = rng.randint(0, n // 2)
    values = list(range(1, n + 1))
    rng.shuffle(values)
    doubled, rest = values[:k], values[k:]
    out = doubled * 2 + rest[: n - 2 * k]
    rng.shuffle(out)
    return [out]
