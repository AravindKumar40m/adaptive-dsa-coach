APPROACHES = {"brute": ("O(n^2 log n)", "O(n^2)"), "optimal": ("O(n log n + n log(max))", "O(1)")}


def brute(numbers, k):
    distances = sorted(abs(numbers[i] - numbers[j]) for i in range(len(numbers)) for j in range(i + 1, len(numbers)))
    return distances[k - 1]


def optimal(numbers, k):
    a = sorted(numbers)

    def count(d):
        j = 0
        total = 0
        for i in range(len(a)):
            while a[i] - a[j] > d:
                j += 1
            total += i - j
        return total

    lo, hi = 0, a[-1] - a[0]
    while lo < hi:
        mid = (lo + hi) // 2
        if count(mid) >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo


def gen(rng):
    n = rng.randint(2, 8)
    return [[rng.randint(0, 12) for _ in range(n)], rng.randint(1, n * (n - 1) // 2)]
