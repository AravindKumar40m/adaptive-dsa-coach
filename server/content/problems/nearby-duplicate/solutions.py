APPROACHES = {"brute": ("O(n * k)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(readings, k):
    for i in range(len(readings)):
        for j in range(i + 1, min(len(readings), i + k + 1)):
            if readings[i] == readings[j]:
                return True
    return False


def optimal(readings, k):
    last = {}
    for i, x in enumerate(readings):
        if x in last and i - last[x] <= k:
            return True
        last[x] = i
    return False


def gen(rng):
    return [[rng.randint(0, 5) for _ in range(rng.randint(1, 10))], rng.randint(0, 5)]
