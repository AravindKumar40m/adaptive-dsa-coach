APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    n = len(numbers)
    repeated = missing = 0
    for v in range(1, n + 1):
        c = numbers.count(v)
        if c == 2:
            repeated = v
        elif c == 0:
            missing = v
    return [repeated, missing]


def optimal(numbers):
    n = len(numbers)
    seen = [False] * (n + 1)
    repeated = 0
    for x in numbers:
        if seen[x]:
            repeated = x
        else:
            seen[x] = True
    return [repeated, n * (n + 1) // 2 - (sum(numbers) - repeated)]


def gen(rng):
    n = rng.randint(2, 9)
    values = list(range(1, n + 1))
    rng.shuffle(values)
    i, j = rng.sample(range(n), 2)
    values[i] = values[j]
    return [values]
