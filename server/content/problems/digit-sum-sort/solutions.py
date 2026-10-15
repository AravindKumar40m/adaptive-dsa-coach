APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(numbers):
    def digit_sum(x):
        total = 0
        while x > 0:
            total += x % 10
            x //= 10
        return total

    items = list(numbers)
    for i in range(len(items)):
        best = i
        for j in range(i + 1, len(items)):
            if (digit_sum(items[j]), items[j]) < (digit_sum(items[best]), items[best]):
                best = j
        items[i], items[best] = items[best], items[i]
    return items


def optimal(numbers):
    def digit_sum(x):
        total = 0
        while x > 0:
            total += x % 10
            x //= 10
        return total

    return sorted(numbers, key=lambda x: (digit_sum(x), x))


def gen(rng):
    return [[rng.choice([rng.randint(0, 30), rng.randint(0, 999)]) for _ in range(rng.randint(0, 9))]]
