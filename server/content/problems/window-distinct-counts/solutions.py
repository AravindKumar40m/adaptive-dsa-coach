APPROACHES = {"brute": ("O(n * k)", "O(k)"), "optimal": ("O(n)", "O(k)")}


def brute(numbers, k):
    return [len(set(numbers[i:i + k])) for i in range(len(numbers) - k + 1)]


def optimal(numbers, k):
    counts = {}
    out = []
    for i, x in enumerate(numbers):
        counts[x] = counts.get(x, 0) + 1
        if i >= k:
            y = numbers[i - k]
            counts[y] -= 1
            if counts[y] == 0:
                del counts[y]
        if i >= k - 1:
            out.append(len(counts))
    return out


def gen(rng):
    return [[rng.randint(1, 4) for _ in range(rng.randint(0, 10))], rng.randint(1, 5)]
