APPROACHES = {"brute": ("O(n^2 log n)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(stones):
    stones = sorted(stones)
    while len(stones) > 1:
        a = stones.pop()
        b = stones.pop()
        if a != b:
            stones.append(a - b)
            stones.sort()
    return stones[0] if stones else 0


def optimal(stones):
    import heapq

    heap = [-s for s in stones]
    heapq.heapify(heap)
    while len(heap) > 1:
        a = -heapq.heappop(heap)
        b = -heapq.heappop(heap)
        if a != b:
            heapq.heappush(heap, -(a - b))
    return -heap[0] if heap else 0


def gen(rng):
    return [[rng.randint(1, 12) for _ in range(rng.randint(1, 8))]]
