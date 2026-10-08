APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(ids):
    return len(set(ids))


def optimal(ids):
    count = 1
    for i in range(1, len(ids)):
        if ids[i] != ids[i - 1]:
            count += 1
    return count


def gen(rng):
    return [sorted(rng.randint(-5, 5) for _ in range(rng.randint(1, 12)))]
