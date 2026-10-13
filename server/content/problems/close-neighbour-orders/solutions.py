APPROACHES = {"brute": ("O(n! * n)", "O(n)"), "optimal": ("O(n!) worst case", "O(n)")}


def brute(numbers, gap):
    from itertools import permutations

    return sum(1 for p in permutations(numbers) if all(abs(p[i] - p[i + 1]) <= gap for i in range(len(p) - 1)))


def optimal(numbers, gap):
    n = len(numbers)
    used = [False] * n

    def go(placed, last):
        if placed == n:
            return 1
        total = 0
        for i in range(n):
            if not used[i] and (placed == 0 or abs(numbers[i] - last) <= gap):
                used[i] = True
                total += go(placed + 1, numbers[i])
                used[i] = False
        return total

    return go(0, 0)


def gen(rng):
    n = rng.randint(2, 6)
    return [rng.sample(range(-5, 13), n), rng.randint(3, 10)]
