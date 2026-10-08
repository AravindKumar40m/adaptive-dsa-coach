APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n log k)", "O(k)")}


def brute(scores, k):
    return sorted(scores, reverse=True)[k - 1]


def optimal(scores, k):
    import heapq

    heap = []
    for x in scores:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]


def gen(rng):
    n = rng.randint(1, 12)
    return [[rng.randint(-10, 10) for _ in range(n)], rng.randint(1, n)]
