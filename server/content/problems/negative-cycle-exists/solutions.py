APPROACHES = {"brute": ("O(n^3)", "O(n^2)"), "optimal": ("O(n * m)", "O(n)")}


def brute(n, edges):
    INF = 10 ** 15
    dist = [[INF] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = min(dist[u][v], w)
    for k in range(n):
        for i in range(n):
            if dist[i][k] >= INF:
                continue
            for j in range(n):
                if dist[k][j] < INF and dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return any(dist[i][i] < 0 for i in range(n))


def optimal(n, edges):
    dist = [0] * n
    for _ in range(n):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            return False
    return True


def gen(rng):
    n = rng.randint(1, 5)
    return [n, [[rng.randrange(n), rng.randrange(n), rng.randint(-3, 6)] for _ in range(rng.randint(0, 8))]]
