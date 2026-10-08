APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(scores):
    distinct = sorted(set(scores), reverse=True)
    return distinct[1] if len(distinct) >= 2 else -1


def optimal(scores):
    first = second = -1
    for x in scores:
        if x > first:
            second = first
            first = x
        elif first > x > second:
            second = x
    return second


def gen(rng):
    return [[rng.randint(0, rng.choice([3, 12, 1000])) for _ in range(rng.randint(1, 10))]]
