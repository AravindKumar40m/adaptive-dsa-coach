APPROACHES = {"brute": ("O(n * m)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(values, order):
    out = []
    remaining = list(values)
    for v in order:
        out += [x for x in remaining if x == v]
        remaining = [x for x in remaining if x != v]
    return out + sorted(remaining)


def optimal(values, order):
    position = {v: i for i, v in enumerate(order)}
    return sorted(values, key=lambda v: (position.get(v, len(order)), v))


def gen(rng):
    values = [rng.randint(1, 9) for _ in range(rng.randint(0, 10))]
    order = rng.sample(range(1, 10), rng.randint(0, 5))
    return [values, order]
