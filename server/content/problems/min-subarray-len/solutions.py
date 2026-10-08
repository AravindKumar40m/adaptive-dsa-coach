APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(deposits, target):
    best = 0
    for i in range(len(deposits)):
        total = 0
        for j in range(i, len(deposits)):
            total += deposits[j]
            if total >= target:
                if best == 0 or j - i + 1 < best:
                    best = j - i + 1
                break
    return best


def optimal(deposits, target):
    left = total = 0
    best = 0
    for right, x in enumerate(deposits):
        total += x
        while total >= target:
            if best == 0 or right - left + 1 < best:
                best = right - left + 1
            total -= deposits[left]
            left += 1
    return best


def gen(rng):
    return [[rng.randint(1, 9) for _ in range(rng.randint(1, 10))], rng.randint(1, 30)]
