APPROACHES = {"brute": ("O(n + m)", "O(n + m)"), "optimal": ("O(n + m)", "O(n)")}


def brute(n, cables):
    if len(cables) < n - 1:
        return -1
    neighbours = [[] for _ in range(n)]
    for a, b in cables:
        neighbours[a].append(b)
        neighbours[b].append(a)
    seen = [False] * n
    groups = 0
    for start in range(n):
        if seen[start]:
            continue
        groups += 1
        stack = [start]
        seen[start] = True
        while stack:
            u = stack.pop()
            for v in neighbours[u]:
                if not seen[v]:
                    seen[v] = True
                    stack.append(v)
    return groups - 1


def optimal(n, cables):
    if len(cables) < n - 1:
        return -1
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    groups = n
    for a, b in cables:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            groups -= 1
    return groups - 1


def gen(rng):
    n = rng.randint(1, 7)
    cables = []
    if n > 1:
        for _ in range(rng.randint(0, 9)):
            cables.append(rng.sample(range(n), 2))
    return [n, cables]
