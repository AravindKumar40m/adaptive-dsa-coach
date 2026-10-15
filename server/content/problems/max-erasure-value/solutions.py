APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    best = 0
    n = len(numbers)
    for i in range(n):
        seen = set()
        total = 0
        for j in range(i, n):
            if numbers[j] in seen:
                break
            seen.add(numbers[j])
            total += numbers[j]
            best = max(best, total)
    return best


def optimal(numbers):
    left = 0
    window = set()
    total = best = 0
    for right, x in enumerate(numbers):
        while x in window:
            window.remove(numbers[left])
            total -= numbers[left]
            left += 1
        window.add(x)
        total += x
        best = max(best, total)
    return best


def gen(rng):
    return [[rng.randint(1, 7) for _ in range(rng.randint(0, 11))]]
