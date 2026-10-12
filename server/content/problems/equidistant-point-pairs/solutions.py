APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(n)")}


def brute(points):
    n = len(points)

    def d2(a, b):
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

    count = 0
    for i in range(n):
        for j in range(n):
            for k in range(n):
                if len({i, j, k}) == 3 and d2(points[i], points[j]) == d2(points[i], points[k]):
                    count += 1
    return count


def optimal(points):
    total = 0
    for a, pa in enumerate(points):
        seen = {}
        for b, pb in enumerate(points):
            if a != b:
                d = (pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2
                seen[d] = seen.get(d, 0) + 1
        for c in seen.values():
            total += c * (c - 1)
    return total


def gen(rng):
    cells = [[x, y] for x in range(-2, 3) for y in range(-2, 3)]
    return [rng.sample(cells, rng.randint(1, 7))]
