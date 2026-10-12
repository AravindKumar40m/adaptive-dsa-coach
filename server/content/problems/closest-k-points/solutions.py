APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n log k)", "O(k)")}


def brute(points, k):
    return sum(sorted(x * x + y * y for x, y in points)[:k])


def optimal(points, k):
    import heapq

    heap = []
    for x, y in points:
        heapq.heappush(heap, -(x * x + y * y))
        if len(heap) > k:
            heapq.heappop(heap)
    return -sum(heap)


def gen(rng):
    n = rng.randint(1, 8)
    return [[[rng.randint(-6, 6), rng.randint(-6, 6)] for _ in range(n)], rng.randint(1, n)]
