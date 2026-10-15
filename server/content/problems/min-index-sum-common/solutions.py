APPROACHES = {"brute": ("O(n * m)", "O(1)"), "optimal": ("O(n + m)", "O(n)")}


def brute(first, second):
    best = -1
    for i, x in enumerate(first):
        for j, y in enumerate(second):
            if x == y and (best == -1 or i + j < best):
                best = i + j
    return best


def optimal(first, second):
    position = {x: i for i, x in enumerate(first)}
    best = -1
    for j, x in enumerate(second):
        if x in position:
            s = position[x] + j
            if best == -1 or s < best:
                best = s
    return best


def gen(rng):
    return [rng.sample(range(10), rng.randint(0, 6)), rng.sample(range(10), rng.randint(0, 6))]
