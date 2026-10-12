APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(min(n, k))")}


def brute(numbers, k):
    n = len(numbers)
    for i in range(n):
        total = numbers[i]
        for j in range(i + 1, n):
            total += numbers[j]
            if total % k == 0:
                return True
    return False


def optimal(numbers, k):
    first = {0: -1}
    total = 0
    for i, x in enumerate(numbers):
        total = (total + x) % k
        if total in first:
            if i - first[total] >= 2:
                return True
        else:
            first[total] = i
    return False


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(1, 8))], rng.randint(1, 8)]
