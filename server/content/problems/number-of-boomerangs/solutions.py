APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(n)")}


def brute(points):
    n = len(points)

    def d2(a, b):
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

    total = 0
    for i in range(n):
        for j in range(n):
            for k in range(n):
                if i != j and i != k and j != k and d2(points[i], points[j]) == d2(points[i], points[k]):
                    total += 1
    return total


def optimal(points):
    total = 0
    for i, p in enumerate(points):
        counts = {}
        for j, q in enumerate(points):
            if i != j:
                d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
                counts[d] = counts.get(d, 0) + 1
        for c in counts.values():
            total += c * (c - 1)
    return total


def gen(rng):
    return [[[rng.randint(-2, 2), rng.randint(-2, 2)] for _ in range(rng.randint(0, 7))]]
