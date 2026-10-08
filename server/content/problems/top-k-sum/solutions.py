APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n log k)", "O(k)")}


def brute(scores, k):
    return sum(sorted(scores, reverse=True)[:k])


def optimal(scores, k):
    import heapq

    heap = []
    for s in scores:
        heapq.heappush(heap, s)
        if len(heap) > k:
            heapq.heappop(heap)
    return sum(heap)


def gen(rng):
    n = rng.randint(1, 10)
    return [[rng.randint(-9, 9) for _ in range(n)], rng.randint(1, n)]
