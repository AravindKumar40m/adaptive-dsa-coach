APPROACHES = {"brute": ("O(N log N)", "O(N)"), "optimal": ("O((r + c) log range)", "O(1)")}


def brute(matrix, k):
    return sorted(x for row in matrix for x in row)[k - 1]


def optimal(matrix, k):
    rows, cols = len(matrix), len(matrix[0])
    lo, hi = matrix[0][0], matrix[-1][-1]
    while lo < hi:
        mid = (lo + hi) // 2
        count = 0
        c = cols - 1
        for r in range(rows):
            while c >= 0 and matrix[r][c] > mid:
                c -= 1
            count += c + 1
        if count >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    base = rng.randint(-5, 5)
    m = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            above = m[r - 1][c] if r else base
            left = m[r][c - 1] if c else base
            m[r][c] = max(above, left) + rng.randint(0, 3)
    return [m, rng.randint(1, rows * cols)]
