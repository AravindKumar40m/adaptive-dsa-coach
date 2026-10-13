APPROACHES = {"brute": ("O(k * n)", "O(n)"), "optimal": ("O(n log n + k log n)", "O(n)")}


def brute(k, w, profits, capital):
    used = [False] * len(profits)
    for _ in range(k):
        best = -1
        for i in range(len(profits)):
            if not used[i] and capital[i] <= w and (best == -1 or profits[i] > profits[best]):
                best = i
        if best == -1:
            break
        used[best] = True
        w += profits[best]
    return w


def optimal(k, w, profits, capital):
    import heapq

    projects = sorted(zip(capital, profits))
    heap = []
    i = 0
    for _ in range(k):
        while i < len(projects) and projects[i][0] <= w:
            heapq.heappush(heap, -projects[i][1])
            i += 1
        if not heap:
            break
        w += -heapq.heappop(heap)
    return w


def gen(rng):
    n = rng.randint(0, 6)
    return [rng.randint(1, 4), rng.randint(0, 3), [rng.randint(0, 6) for _ in range(n)], [rng.randint(0, 6) for _ in range(n)]]
