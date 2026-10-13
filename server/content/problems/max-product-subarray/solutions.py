APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    best = numbers[0]
    for i in range(len(numbers)):
        product = 1
        for j in range(i, len(numbers)):
            product *= numbers[j]
            best = max(best, product)
    return best


def optimal(numbers):
    best = max_here = min_here = numbers[0]
    for x in numbers[1:]:
        candidates = (x, max_here * x, min_here * x)
        max_here = max(candidates)
        min_here = min(candidates)
        best = max(best, max_here)
    return best


def gen(rng):
    return [[rng.randint(-3, 3) for _ in range(rng.randint(1, 9))]]
