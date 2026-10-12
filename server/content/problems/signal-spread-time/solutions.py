APPROACHES = {"brute": ("O(V * E)", "O(V)"), "optimal": ("O((V + E) log V)", "O(V + E)")}


def brute(stations, links, source):
    INF = float("inf")
    dist = [INF] * stations
    dist[source] = 0
    for _ in range(stations):
        for a, b, t in links:
            if dist[a] + t < dist[b]:
                dist[b] = dist[a] + t
    worst = max(dist)
    return -1 if worst == INF else worst


def optimal(stations, links, source):
    import heapq

    adj = [[] for _ in range(stations)]
    for a, b, t in links:
        adj[a].append((b, t))
    best = [None] * stations
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if best[u] is not None:
            continue
        best[u] = d
        for v, t in adj[u]:
            if best[v] is None:
                heapq.heappush(heap, (d + t, v))
    if any(b is None for b in best):
        return -1
    return max(best)


def gen(rng):
    stations = rng.randint(1, 7)
    source = rng.randrange(stations)
    links = [[rng.randrange(stations), rng.randrange(stations), rng.randint(1, 9)] for _ in range(rng.randint(0, 12))]
    if rng.random() < 0.6:  # often make sure every station can be reached, so the answer is not -1 half the time
        rest = [s for s in range(stations) if s != source]
        rng.shuffle(rest)
        order = [source] + rest
        for a, b in zip(order, order[1:]):
            links.append([a, b, rng.randint(1, 9)])
        rng.shuffle(links)
    return [stations, links, source]
