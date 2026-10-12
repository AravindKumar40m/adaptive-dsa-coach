APPROACHES = {"brute": ("O(E * (V + E))", "O(V + E)"), "optimal": ("O(E * alpha(V))", "O(V)")}


def brute(nodes, edges):
    adj = [[] for _ in range(nodes)]
    for i, (a, b) in enumerate(edges):
        seen = {a}
        stack = [a]
        while stack:
            x = stack.pop()
            for y in adj[x]:
                if y not in seen:
                    seen.add(y)
                    stack.append(y)
        if b in seen:
            return i
        adj[a].append(b)
        adj[b].append(a)
    return -1


def optimal(nodes, edges):
    parent = list(range(nodes))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i, (a, b) in enumerate(edges):
        ra, rb = find(a), find(b)
        if ra == rb:
            return i
        parent[ra] = rb
    return -1


def gen(rng):
    nodes = rng.randint(1, 8)
    edges = []
    if nodes >= 2:
        if rng.random() < 0.25:
            order = list(range(nodes))
            rng.shuffle(order)
            for i in range(1, nodes):
                edges.append([order[i], order[rng.randrange(i)]])
            rng.shuffle(edges)
        else:
            for _ in range(rng.randint(0, 10)):
                a, b = rng.sample(range(nodes), 2)
                edges.append([a, b])
    return [nodes, edges]
