APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    seen = {}
    out = []
    for x in numbers:
        if seen.get(x, 0) < 2:
            out.append(x)
        seen[x] = seen.get(x, 0) + 1
    return out


def optimal(numbers):
    out = []
    for x in numbers:
        if len(out) < 2 or x != out[len(out) - 2]:
            out.append(x)
    return out


def gen(rng):
    return [sorted(rng.randint(-3, 3) for _ in range(rng.randint(0, 11)))]
