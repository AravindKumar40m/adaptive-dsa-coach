APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    kept = [x for x in numbers if x != 0]
    return kept + [0] * (len(numbers) - len(kept))


def optimal(numbers):
    a = list(numbers)
    write = 0
    for read in range(len(a)):
        if a[read] != 0:
            a[write], a[read] = a[read], a[write]
            write += 1
    return a


def gen(rng):
    return [[rng.choice([0, 0, 1, 2, 3, -1]) for _ in range(rng.randint(0, 10))]]
