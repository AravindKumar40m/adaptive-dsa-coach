APPROACHES = {"brute": ("O(n^2 log n)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(stream):
    total = 0
    seen = []
    for x in stream:
        seen.append(x)
        total += sorted(seen)[(len(seen) - 1) // 2]
    return total


def optimal(stream):
    import heapq

    low, high = [], []
    total = 0
    for x in stream:
        if low and x > -low[0]:
            heapq.heappush(high, x)
        else:
            heapq.heappush(low, -x)
        if len(low) > len(high) + 1:
            heapq.heappush(high, -heapq.heappop(low))
        elif len(high) > len(low):
            heapq.heappush(low, -heapq.heappop(high))
        total += -low[0]
    return total


def gen(rng):
    return [[rng.randint(-9, 9) for _ in range(rng.randint(1, 10))]]
