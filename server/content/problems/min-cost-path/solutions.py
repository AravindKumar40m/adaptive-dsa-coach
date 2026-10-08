APPROACHES = {"brute": ("O(n * m)", "O(n)"), "optimal": ("O((n + m) log n)", "O(n + m)")}


def brute(n, roads, start, end):
    # Bellman-Ford: relax every road n - 1 times
    inf = float("inf")
    dist = [inf] * n
    dist[start] = 0
    for _ in range(n - 1):
        for u, v, w in roads:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    return -1 if dist[end] == inf else dist[end]


def optimal(n, roads, start, end):
    import heapq

    adjacent = [[] for _ in range(n)]
    for u, v, w in roads:
        adjacent[u].append((v, w))
    dist = [None] * n
    dist[start] = 0
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        if u == end:
            return d
        for v, w in adjacent[u]:
            nd = d + w
            if dist[v] is None or nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return -1


def gen(rng):
    n = rng.randint(1, 6)
    roads = []
    if n > 1:
        for _ in range(rng.randint(0, 10)):
            u, v = rng.randrange(n), rng.randrange(n)
            if u != v:
                roads.append([u, v, rng.randint(1, 9)])
    return [n, roads, rng.randrange(n), rng.randrange(n)]
