APPROACHES = {"brute": ("O(2^9)", "O(1)"), "optimal": ("O(C(9, k))", "O(k)")}


def brute(k, n):
    from itertools import combinations

    return sum(1 for combo in combinations(range(1, 10), k) if sum(combo) == n)


def optimal(k, n):
    def go(start, left, remaining):
        if left == 0:
            return 1 if remaining == 0 else 0
        total = 0
        for d in range(start, 10):
            if d > remaining:
                break
            total += go(d + 1, left - 1, remaining - d)
        return total

    return go(1, k, n)


def gen(rng):
    k = rng.randint(1, 6)
    return [k, rng.randint(max(1, k * (k + 1) // 2 - 1), min(60, 9 * k + 1))]
