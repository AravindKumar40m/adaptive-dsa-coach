APPROACHES = {"brute": ("O((n-1)!!)", "O(n)"), "optimal": ("O(n log n)", "O(1)")}


def brute(numbers):
    def best(items):
        if not items:
            return 0
        first = items[0]
        result = None
        for i in range(1, len(items)):
            rest = items[1:i] + items[i + 1:]
            cost = max(first + items[i], best(rest))
            if result is None or cost < result:
                result = cost
        return result

    return best(list(numbers))


def optimal(numbers):
    a = sorted(numbers)
    n = len(a)
    result = 0
    for i in range(n // 2):
        result = max(result, a[i] + a[n - 1 - i])
    return result


def gen(rng):
    return [[rng.randint(1, 20) for _ in range(2 * rng.randint(0, 4))]]
