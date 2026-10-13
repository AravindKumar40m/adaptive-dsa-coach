APPROACHES = {"brute": ("O(2^p * n)", "O(p)"), "optimal": ("O(n log n)", "O(1)")}


def brute(balloons):
    from itertools import combinations

    if not balloons:
        return 0
    points = sorted({p for b in balloons for p in b})
    for k in range(1, len(points) + 1):
        for chosen in combinations(points, k):
            if all(any(s <= x <= e for x in chosen) for s, e in balloons):
                return k
    return 0


def optimal(balloons):
    arrows = 0
    last = None
    for s, e in sorted(balloons, key=lambda b: b[1]):
        if last is None or s > last:
            arrows += 1
            last = e
    return arrows


def gen(rng):
    out = []
    for _ in range(rng.randint(0, 6)):
        s = rng.randint(0, 10)
        out.append([s, s + rng.randint(0, 5)])
    return [out]
