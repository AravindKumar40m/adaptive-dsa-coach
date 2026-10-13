APPROACHES = {"brute": ("O(2^n * n)", "O(2^n)"), "optimal": ("O(2^n)", "O(n)")}


def brute(numbers, target):
    from itertools import combinations

    found = set()
    for size in range(1, len(numbers) + 1):
        for combo in combinations(sorted(numbers), size):
            if sum(combo) == target:
                found.add(combo)
    return len(found)


def optimal(numbers, target):
    a = sorted(numbers)

    def go(start, left):
        if left == 0:
            return 1
        total = 0
        for i in range(start, len(a)):
            if i > start and a[i] == a[i - 1]:
                continue
            if a[i] > left:
                break
            total += go(i + 1, left - a[i])
        return total

    return go(0, target)


def gen(rng):
    return [[rng.randint(1, 5) for _ in range(rng.randint(3, 9))], rng.randint(3, 10)]
