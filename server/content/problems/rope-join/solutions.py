APPROACHES = {"brute": ("O(n!)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}
EXPECT_SLOW = {"brute"}  # trying every joining order is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 7


def brute(ropes):
    ropes = list(ropes)
    if len(ropes) == 1:
        return 0
    best = None
    for i in range(len(ropes)):
        for j in range(i + 1, len(ropes)):
            joined = ropes[i] + ropes[j]
            rest = [ropes[k] for k in range(len(ropes)) if k != i and k != j] + [joined]
            cost = joined + brute(rest)
            if best is None or cost < best:
                best = cost
    return best


def optimal(ropes):
    import heapq

    heap = list(ropes)
    heapq.heapify(heap)
    total = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)
        b = heapq.heappop(heap)
        total += a + b
        heapq.heappush(heap, a + b)
    return total


def gen(rng):
    return [[rng.randint(1, 20) for _ in range(rng.randint(1, 6))]]
