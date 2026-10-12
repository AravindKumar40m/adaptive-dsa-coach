APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(1)")}


def brute(numbers, target):
    from itertools import combinations

    best = None
    for combo in combinations(numbers, 3):
        s = sum(combo)
        if best is None or abs(s - target) < abs(best - target) or (abs(s - target) == abs(best - target) and s < best):
            best = s
    return best


def optimal(numbers, target):
    a = sorted(numbers)
    best = None
    for i in range(len(a) - 2):
        lo, hi = i + 1, len(a) - 1
        while lo < hi:
            s = a[i] + a[lo] + a[hi]
            if best is None or abs(s - target) < abs(best - target) or (abs(s - target) == abs(best - target) and s < best):
                best = s
            if s < target:
                lo += 1
            elif s > target:
                hi -= 1
            else:
                return s
    return best


def gen(rng):
    return [[rng.randint(-6, 9) for _ in range(rng.randint(3, 8))], rng.randint(-10, 20)]
