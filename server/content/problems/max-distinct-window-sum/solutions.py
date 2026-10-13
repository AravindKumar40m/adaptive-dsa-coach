APPROACHES = {"brute": ("O(n * k)", "O(k)"), "optimal": ("O(n)", "O(k)")}


def brute(numbers, k):
    best = 0
    for i in range(len(numbers) - k + 1):
        block = numbers[i:i + k]
        if len(set(block)) == k:
            best = max(best, sum(block))
    return best


def optimal(numbers, k):
    counts = {}
    total = 0
    best = 0
    for i, x in enumerate(numbers):
        counts[x] = counts.get(x, 0) + 1
        total += x
        if i >= k:
            y = numbers[i - k]
            counts[y] -= 1
            if counts[y] == 0:
                del counts[y]
            total -= y
        if i >= k - 1 and len(counts) == k:
            best = max(best, total)
    return best


def gen(rng):
    return [[rng.randint(1, 7) for _ in range(rng.randint(0, 11))], rng.randint(1, 5)]
