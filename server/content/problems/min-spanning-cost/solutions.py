APPROACHES = {"brute": ("O(C(E, V-1) * V)", "O(V)"), "optimal": ("O(E log E)", "O(V)")}


def brute(nodes, roads):
    from itertools import combinations

    if nodes == 1:
        return 0
    best = -1
    for chosen in combinations(roads, nodes - 1):
        parent = list(range(nodes))
        joined = 0
        for a, b, cost in chosen:
            ra, rb = a, b
            while parent[ra] != ra:
                ra = parent[ra]
            while parent[rb] != rb:
                rb = parent[rb]
            if ra != rb:
                parent[ra] = rb
                joined += 1
        if joined == nodes - 1:
            total = sum(c for _, _, c in chosen)
            if best == -1 or total < best:
                best = total
    return best


def optimal(nodes, roads):
    parent = list(range(nodes))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    joined = 0
    for a, b, cost in sorted(roads, key=lambda r: r[2]):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            total += cost
            joined += 1
    return total if joined == nodes - 1 else -1


def gen(rng):
    nodes = rng.randint(1, 6)
    roads = []
    if nodes >= 2:
        for _ in range(rng.randint(0, 9)):
            a, b = rng.sample(range(nodes), 2)
            roads.append([a, b, rng.randint(1, 9)])
    return [nodes, roads]
