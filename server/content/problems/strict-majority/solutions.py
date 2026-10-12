APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    from collections import Counter

    for value, count in Counter(numbers).items():
        if count * 2 > len(numbers):
            return value
    return -1


def optimal(numbers):
    candidate, votes = -1, 0
    for x in numbers:
        if votes == 0:
            candidate = x
        votes += 1 if x == candidate else -1
    count = 0
    for x in numbers:
        if x == candidate:
            count += 1
    return candidate if count * 2 > len(numbers) else -1


def gen(rng):
    n = rng.randint(1, 11)
    if rng.random() < 0.5:
        major = rng.randint(0, 4)
        count = n // 2 + 1
        numbers = [major] * count + [rng.randint(0, 4) for _ in range(n - count)]
        rng.shuffle(numbers)
    else:
        numbers = [rng.randint(0, 3) for _ in range(n)]
    return [numbers]
