APPROACHES = {"brute": ("O(6 * n)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(tops, bottoms):
    n = len(tops)
    if n == 0:
        return 0
    best = None
    for x in range(1, 7):
        for side in (tops, bottoms):
            other = bottoms if side is tops else tops
            rotations = 0
            ok = True
            for i in range(n):
                if side[i] == x:
                    continue
                if other[i] == x:
                    rotations += 1
                else:
                    ok = False
                    break
            if ok and (best is None or rotations < best):
                best = rotations
    return -1 if best is None else best


def optimal(tops, bottoms):
    if not tops:
        return 0

    def check(x):
        rotate_top = rotate_bottom = 0
        for t, b in zip(tops, bottoms):
            if t != x and b != x:
                return float("inf")
            if t != x:
                rotate_top += 1
            elif b != x:
                rotate_bottom += 1
        return min(rotate_top, rotate_bottom)

    best = min(check(tops[0]), check(bottoms[0]))
    return -1 if best == float("inf") else best


def gen(rng):
    n = rng.randint(0, 7)
    if rng.random() < 0.6 and n > 0:
        x = rng.randint(1, 3)
        tops, bottoms = [], []
        for _ in range(n):
            a, b = x, rng.randint(1, 3)
            tops.append(a)
            bottoms.append(b)
            if rng.random() < 0.5:
                tops[-1], bottoms[-1] = bottoms[-1], tops[-1]
        return [tops, bottoms]
    return [[rng.randint(1, 3) for _ in range(n)], [rng.randint(1, 3) for _ in range(n)]]
