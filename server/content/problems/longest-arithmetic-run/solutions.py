APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(n^2)")}


def brute(numbers):
    n = len(numbers)
    best = min(n, 2)
    for i in range(n):
        for j in range(i + 1, n):
            d = numbers[j] - numbers[i]
            length = 2
            last = numbers[j]
            for k in range(j + 1, n):
                if numbers[k] == last + d:
                    length += 1
                    last = numbers[k]
            best = max(best, length)
    return best


def optimal(numbers):
    n = len(numbers)
    best = min(n, 2)
    table = [dict() for _ in range(n)]
    for j in range(n):
        for i in range(j):
            d = numbers[j] - numbers[i]
            table[j][d] = table[i].get(d, 1) + 1
            best = max(best, table[j][d])
    return best


def gen(rng):
    return [[rng.randint(-4, 8) for _ in range(rng.randint(0, 10))]]
