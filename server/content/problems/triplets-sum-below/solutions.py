APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(1)")}


def brute(numbers, limit):
    from itertools import combinations

    return sum(1 for combo in combinations(numbers, 3) if sum(combo) < limit)


def optimal(numbers, limit):
    a = sorted(numbers)
    count = 0
    for i in range(len(a) - 2):
        lo, hi = i + 1, len(a) - 1
        while lo < hi:
            if a[i] + a[lo] + a[hi] < limit:
                count += hi - lo
                lo += 1
            else:
                hi -= 1
    return count


def gen(rng):
    return [[rng.randint(-5, 9) for _ in range(rng.randint(0, 8))], rng.randint(2, 28)]
