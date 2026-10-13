APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(ranges):
    n = len(ranges) - 1
    INF = 10 ** 9
    best = [INF] * (n + 1)
    best[0] = 0
    for x in range(1, n + 1):
        for i, r in enumerate(ranges):
            left = max(0, i - r)
            right = min(n, i + r)
            if left <= x - 1 and right >= x and best[left] + 1 < best[x]:
                best[x] = best[left] + 1
    return -1 if best[n] >= INF else best[n]


def optimal(ranges):
    n = len(ranges) - 1
    furthest = [0] * (n + 1)
    for i, r in enumerate(ranges):
        left = max(0, i - r)
        furthest[left] = max(furthest[left], i + r)
    taps = 0
    current_end = 0
    far = 0
    for i in range(n):
        far = max(far, furthest[i])
        if i == current_end:
            if far <= i:
                return -1
            taps += 1
            current_end = far
            if current_end >= n:
                return taps
    return -1


def gen(rng):
    n = rng.randint(1, 8)
    return [[rng.randint(0, 3) for _ in range(n + 1)]]
