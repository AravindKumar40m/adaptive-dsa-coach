APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    n = len(numbers)

    def sorted_list(a):
        return all(a[i] <= a[i + 1] for i in range(len(a) - 1))

    if sorted_list(numbers):
        return True
    candidates = set(numbers)
    for i in range(n):
        for v in candidates:
            a = list(numbers)
            a[i] = v
            if sorted_list(a):
                return True
    return False


def optimal(numbers):
    a = list(numbers)
    changes = 0
    for i in range(len(a) - 1):
        if a[i] > a[i + 1]:
            changes += 1
            if changes > 1:
                return False
            if i == 0 or a[i - 1] <= a[i + 1]:
                a[i] = a[i + 1]
            else:
                a[i + 1] = a[i]
    return True


def gen(rng):
    if rng.random() < 0.5:
        a = sorted(rng.randint(1, 9) for _ in range(rng.randint(2, 8)))
        a[rng.randrange(len(a))] = rng.randint(0, 10)
        return [a]
    return [[rng.randint(1, 6) for _ in range(rng.randint(0, 8))]]
