APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(bits):
    best = 0
    for i in range(len(bits)):
        balance = 0
        for j in range(i, len(bits)):
            balance += 1 if bits[j] == 1 else -1
            if balance == 0:
                best = max(best, j - i + 1)
    return best


def optimal(bits):
    first = {0: -1}
    total = best = 0
    for i, b in enumerate(bits):
        total += 1 if b == 1 else -1
        if total in first:
            best = max(best, i - first[total])
        else:
            first[total] = i
    return best


def gen(rng):
    return [[rng.randint(0, 1) for _ in range(rng.randint(1, 12))]]
