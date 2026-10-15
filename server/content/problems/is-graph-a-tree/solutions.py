APPROACHES = {"brute": ("O(n + m)", "O(n + m)"), "optimal": ("O(n + m)", "O(n)")}


def brute(n, edges):
    if len(edges) != n - 1:
        return False
    adjacent = [[] for _ in range(n)]
    for a, b in edges:
        adjacent[a].append(b)
        adjacent[b].append(a)
    seen = {0}
    stack = [0]
    while stack:
        u = stack.pop()
        for v in adjacent[u]:
            if v not in seen:
                seen.add(v)
                stack.append(v)
    return len(seen) == n


def optimal(n, edges):
    if len(edges) != n - 1:
        return False
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        parent[ra] = rb
    return True


def gen(rng):
    n = rng.randint(1, 7)
    if rng.random() < 0.5 and n > 1:
        edges = [[rng.randrange(i), i] for i in range(1, n)]
        if rng.random() < 0.4:
            a, b = rng.sample(range(n), 2)
            edges[rng.randrange(len(edges))] = [a, b]
        return [n, edges]
    if n == 1:
        return [n, []]
    return [n, [rng.sample(range(n), 2) for _ in range(rng.randint(0, n))]]
