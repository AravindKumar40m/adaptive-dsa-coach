APPROACHES = {"brute": ("O(E * (V + E))", "O(V)"), "optimal": ("O(V + E)", "O(V + E)")}


def brute(nodes, links):
    def components(skip):
        parent = list(range(nodes))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        count = nodes
        for i, (a, b) in enumerate(links):
            if i == skip:
                continue
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
                count -= 1
        return count

    base = components(-1)
    return sum(1 for i in range(len(links)) if components(i) > base)


def optimal(nodes, links):
    adj = [[] for _ in range(nodes)]
    for i, (a, b) in enumerate(links):
        adj[a].append((b, i))
        adj[b].append((a, i))
    order = [-1] * nodes
    low = [0] * nodes
    timer = [0]
    found = [0]

    def visit(u, via):
        order[u] = low[u] = timer[0]
        timer[0] += 1
        for v, edge in adj[u]:
            if edge == via:
                continue
            if order[v] == -1:
                visit(v, edge)
                low[u] = min(low[u], low[v])
                if low[v] > order[u]:
                    found[0] += 1
            else:
                low[u] = min(low[u], order[v])

    for s in range(nodes):
        if order[s] == -1:
            visit(s, -1)
    return found[0]


def gen(rng):
    nodes = rng.randint(1, 8)
    links = []
    if nodes >= 2:
        for _ in range(rng.randint(2, 9)):
            a, b = rng.sample(range(nodes), 2)
            links.append([a, b])
    return [nodes, links]
