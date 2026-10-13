APPROACHES = {"brute": ("O(range)", "O(range)"), "optimal": ("O(n)", "O(1)")}


def brute(intervals, new_interval):
    covered = set()
    for s, e in intervals + [new_interval]:
        covered.update(range(2 * s, 2 * e + 1))
    return sum(1 for c in covered if c - 1 not in covered)


def optimal(intervals, new_interval):
    s, e = new_interval
    before = sum(1 for a, b in intervals if b < s)
    after = sum(1 for a, b in intervals if a > e)
    return before + after + 1


def gen(rng):
    out = []
    pos = 0
    for _ in range(rng.randint(0, 5)):
        start = pos + rng.randint(1, 3)
        end = start + rng.randint(0, 3)
        out.append([start, end])
        pos = end
    s = rng.randint(0, pos + 3)
    return [out, [s, s + rng.randint(0, 5)]]
