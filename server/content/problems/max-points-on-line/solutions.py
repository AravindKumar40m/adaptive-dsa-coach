APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(n)")}


def brute(points):
    n = len(points)
    if n <= 2:
        return n
    best = 2
    for i in range(n):
        for j in range(i + 1, n):
            count = 2
            for k in range(n):
                if k != i and k != j:
                    (x1, y1), (x2, y2), (x3, y3) = points[i], points[j], points[k]
                    if (x2 - x1) * (y3 - y1) == (y2 - y1) * (x3 - x1):
                        count += 1
            best = max(best, count)
    return best


def optimal(points):
    from math import gcd

    n = len(points)
    best = 1
    for i in range(n):
        slopes = {}
        for j in range(i + 1, n):
            dx = points[j][0] - points[i][0]
            dy = points[j][1] - points[i][1]
            g = gcd(abs(dx), abs(dy))
            dx //= g
            dy //= g
            if dx < 0 or (dx == 0 and dy < 0):
                dx, dy = -dx, -dy
            slopes[(dx, dy)] = slopes.get((dx, dy), 0) + 1
        if slopes:
            best = max(best, max(slopes.values()) + 1)
    return best


def gen(rng):
    cells = [[x, y] for x in range(-3, 4) for y in range(-3, 4)]
    return [rng.sample(cells, rng.randint(1, 7))]
