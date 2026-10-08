APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    for i in range(len(numbers) + 1):
        if i not in numbers:
            return i


def optimal(numbers):
    n = len(numbers)
    return n * (n + 1) // 2 - sum(numbers)


def gen(rng):
    n = rng.randint(1, 10)
    values = list(range(n + 1))
    values.remove(rng.randint(0, n))
    rng.shuffle(values)
    return [values]
