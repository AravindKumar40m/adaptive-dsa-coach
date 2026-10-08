APPROACHES = {"brute": ("O((n + m) log(n + m))", "O(n + m)"), "optimal": ("O(log(min(n, m)))", "O(1)")}


def brute(first, second):
    merged = sorted(first + second)
    n = len(merged)
    if n % 2 == 1:
        return 2 * merged[n // 2]
    return merged[n // 2 - 1] + merged[n // 2]


def optimal(first, second):
    a, b = (first, second) if len(first) <= len(second) else (second, first)
    m, n = len(a), len(b)
    half = (m + n + 1) // 2
    inf = float("inf")
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        a_left = a[i - 1] if i > 0 else -inf
        a_right = a[i] if i < m else inf
        b_left = b[j - 1] if j > 0 else -inf
        b_right = b[j] if j < n else inf
        if a_left <= b_right and b_left <= a_right:
            if (m + n) % 2 == 1:
                return 2 * max(a_left, b_left)
            return max(a_left, b_left) + min(a_right, b_right)
        if a_left > b_right:
            hi = i - 1
        else:
            lo = i + 1


def gen(rng):
    while True:
        first = sorted(rng.randint(-9, 9) for _ in range(rng.randint(0, 6)))
        second = sorted(rng.randint(-9, 9) for _ in range(rng.randint(0, 6)))
        if first or second:
            return [first, second]
