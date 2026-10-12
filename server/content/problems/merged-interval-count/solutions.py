APPROACHES = {"brute": ("O(range)", "O(range)"), "optimal": ("O(n log n)", "O(1)")}


def brute(intervals):
    covered = set()
    for s, e in intervals:
        covered.update(range(2 * s, 2 * e + 1))
    return sum(1 for c in covered if c - 1 not in covered)


def optimal(intervals):
    count = 0
    end = None
    for s, e in sorted(intervals):
        if end is None or s > end:
            count += 1
            end = e
        else:
            end = max(end, e)
    return count


def gen(rng):
    out = []
    for _ in range(rng.randint(0, 7)):
        s = rng.randint(0, 14)
        out.append([s, s + rng.randint(0, 4)])
    return [out]
