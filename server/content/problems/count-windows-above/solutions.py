APPROACHES = {"brute": ("O(n * k)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(sales, k, limit):
    return sum(1 for i in range(len(sales) - k + 1) if sum(sales[i:i + k]) >= limit)


def optimal(sales, k, limit):
    window = sum(sales[:k])
    count = 1 if window >= limit else 0
    for i in range(k, len(sales)):
        window += sales[i] - sales[i - k]
        if window >= limit:
            count += 1
    return count


def gen(rng):
    n = rng.randint(1, 10)
    k = rng.randint(1, n)
    return [[rng.randint(0, 9) for _ in range(n)], k, rng.randint(0, 6 * k)]  # window sums average about 4.5 * k
