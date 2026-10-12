APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n * sum)", "O(sum)")}


def brute(numbers, target):
    from itertools import product

    return sum(1 for signs in product((1, -1), repeat=len(numbers)) if sum(s * x for s, x in zip(signs, numbers)) == target)


def optimal(numbers, target):
    total = sum(numbers)
    if abs(target) > total or (total + target) % 2:
        return 0
    want = (total + target) // 2
    ways = [0] * (want + 1)
    ways[0] = 1
    for x in numbers:
        for s in range(want, x - 1, -1):
            ways[s] += ways[s - x]
    return ways[want]


def gen(rng):
    numbers = [rng.randint(0, 6) for _ in range(rng.randint(1, 9))]
    if rng.random() < 0.7:
        target = sum(rng.choice((1, -1)) * x for x in numbers)
    else:
        target = rng.randint(-12, 12)
    return [numbers, target]
