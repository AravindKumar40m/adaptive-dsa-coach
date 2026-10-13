APPROACHES = {"brute": ("O(n^2)", "O(n^2)"), "optimal": ("O((n + m) log(n + m))", "O(n + m)")}


def brute(wells, pipes):
    n = len(wells)
    INF = 10 ** 18
    weight = [[INF] * (n + 1) for _ in range(n + 1)]
    for i, w in enumerate(wells):
        weight[i][n] = weight[n][i] = w
    for a, b, cost in pipes:
        weight[a][b] = weight[b][a] = min(weight[a][b], cost)
    in_tree = [False] * (n + 1)
    best = [INF] * (n + 1)
    best[n] = 0
    total = 0
    for _ in range(n + 1):
        u = min((v for v in range(n + 1) if not in_tree[v]), key=lambda v: best[v])
        in_tree[u] = True
        total += best[u]
        for v in range(n + 1):
            if not in_tree[v] and weight[u][v] < best[v]:
                best[v] = weight[u][v]
    return total


def optimal(wells, pipes):
    n = len(wells)
    edges = [(cost, a, b) for a, b, cost in pipes] + [(wells[i], i, n) for i in range(n)]
    edges.sort()
    parent = list(range(n + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    for cost, a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            total += cost
    return total


def gen(rng):
    n = rng.randint(1, 6)
    pipes = []
    if n > 1:
        for _ in range(rng.randint(0, 8)):
            a, b = rng.sample(range(n), 2)
            pipes.append([a, b, rng.randint(1, 9)])
    return [[rng.randint(1, 9) for _ in range(n)], pipes]
