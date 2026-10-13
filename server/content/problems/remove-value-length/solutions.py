APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers, value):
    return [x for x in numbers if x != value]


def optimal(numbers, value):
    a = list(numbers)
    write = 0
    for read in range(len(a)):
        if a[read] != value:
            a[write] = a[read]
            write += 1
    return a[:write]


def gen(rng):
    return [[rng.randint(0, 4) for _ in range(rng.randint(0, 10))], rng.randint(0, 4)]
