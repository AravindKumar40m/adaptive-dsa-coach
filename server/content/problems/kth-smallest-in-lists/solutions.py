APPROACHES = {"brute": ("O(N log N)", "O(N)"), "optimal": ("O(k log m)", "O(m)")}


def brute(lists, k):
    return sorted(x for row in lists for x in row)[k - 1]


def optimal(lists, k):
    import heapq

    heap = [(row[0], i, 0) for i, row in enumerate(lists) if row]
    heapq.heapify(heap)
    value = None
    for _ in range(k):
        value, i, j = heapq.heappop(heap)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
    return value


def gen(rng):
    while True:
        lists = [sorted(rng.randint(-5, 9) for _ in range(rng.randint(0, 4))) for _ in range(rng.randint(1, 4))]
        total = sum(len(row) for row in lists)
        if total >= 1:
            return [lists, rng.randint(1, total)]
