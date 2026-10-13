APPROACHES = {"brute": ("O(N * k * n)", "O(1)"), "optimal": ("O(N log k)", "O(k)")}


def brute(lists):
    values = sorted({v for row in lists for v in row})
    best = None
    for low in values:
        high = None
        covered = True
        for row in lists:
            candidates = [v for v in row if v >= low]
            if not candidates:
                covered = False
                break
            smallest = min(candidates)
            high = smallest if high is None else max(high, smallest)
        if covered and (best is None or high - low < best[1] - best[0]):
            best = [low, high]
    return best


def optimal(lists):
    import heapq

    heap = [(row[0], r, 0) for r, row in enumerate(lists)]
    heapq.heapify(heap)
    high = max(row[0] for row in lists)
    best = [heap[0][0], high]
    while True:
        low, r, c = heapq.heappop(heap)
        if high - low < best[1] - best[0]:
            best = [low, high]
        if c + 1 == len(lists[r]):
            break
        nxt = lists[r][c + 1]
        high = max(high, nxt)
        heapq.heappush(heap, (nxt, r, c + 1))
    return best


def gen(rng):
    return [[sorted(rng.sample(range(15), rng.randint(1, 4))) for _ in range(rng.randint(1, 4))]]
