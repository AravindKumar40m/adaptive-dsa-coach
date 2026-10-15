APPROACHES = {"brute": ("O(n * answer)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(changes):
    start = 1
    while True:
        balance = start
        ok = True
        for c in changes:
            balance += c
            if balance < 1:
                ok = False
                break
        if ok:
            return start
        start += 1


def optimal(changes):
    prefix = 0
    lowest = 0
    for c in changes:
        prefix += c
        lowest = min(lowest, prefix)
    return 1 - lowest


def gen(rng):
    return [[rng.randint(-6, 6) for _ in range(rng.randint(0, 9))]]
