APPROACHES = {"brute": ("O(number of routes)", "O(n)"), "optimal": ("O(n + m)", "O(n)")}


def brute(n, edges):
    adjacent = [[] for _ in range(n)]
    for a, b in edges:
        adjacent[a].append(b)

    def walk(u):
        if u == n - 1:
            return 1
        return sum(walk(v) for v in adjacent[u])

    return walk(0)


def optimal(n, edges):
    adjacent = [[] for _ in range(n)]
    for a, b in edges:
        adjacent[a].append(b)
    memo = {}

    def ways(u):
        if u == n - 1:
            return 1
        if u not in memo:
            memo[u] = sum(ways(v) for v in adjacent[u])
        return memo[u]

    return ways(0)


def gen(rng):
    n = rng.randint(1, 8)
    order = list(range(n))
    rng.shuffle(order)
    rank = {node: i for i, node in enumerate(order)}
    edges = []
    for a in range(n):
        for b in range(n):
            if a != b and rank[a] < rank[b] and rng.random() < 0.4:
                edges.append([a, b])
    return [n, edges]
