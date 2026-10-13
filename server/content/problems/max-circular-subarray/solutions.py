APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    n = len(numbers)
    best = None
    for i in range(n):
        total = 0
        for length in range(1, n + 1):
            total += numbers[(i + length - 1) % n]
            if best is None or total > best:
                best = total
    return best


def optimal(numbers):
    total = sum(numbers)
    best = cur = numbers[0]
    worst = cur_min = numbers[0]
    for x in numbers[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
        cur_min = min(x, cur_min + x)
        worst = min(worst, cur_min)
    return best if best < 0 else max(best, total - worst)


def gen(rng):
    return [[rng.randint(-6, 9) for _ in range(rng.randint(1, 8))]]
