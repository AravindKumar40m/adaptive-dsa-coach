APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(n, edges):
    adjacent = [[] for _ in range(n)]
    for a, b in edges:
        adjacent[a].append(b)
        adjacent[b].append(a)

    def height(root):
        depth = {root: 0}
        queue = [root]
        for u in queue:
            for v in adjacent[u]:
                if v not in depth:
                    depth[v] = depth[u] + 1
                    queue.append(v)
        return max(depth.values())

    heights = [height(r) for r in range(n)]
    best = min(heights)
    return [r for r in range(n) if heights[r] == best]


def optimal(n, edges):
    if n <= 2:
        return list(range(n))
    adjacent = [[] for _ in range(n)]
    for a, b in edges:
        adjacent[a].append(b)
        adjacent[b].append(a)
    degree = [len(adjacent[v]) for v in range(n)]
    leaves = [v for v in range(n) if degree[v] == 1]
    remaining = n
    while remaining > 2:
        remaining -= len(leaves)
        new_leaves = []
        for leaf in leaves:
            for v in adjacent[leaf]:
                degree[v] -= 1
                if degree[v] == 1:
                    new_leaves.append(v)
        leaves = new_leaves
    return sorted(leaves)


def gen(rng):
    n = rng.randint(1, 9)
    labels = list(range(n))
    rng.shuffle(labels)
    edges = []
    for i in range(1, n):
        j = rng.randrange(i)
        edges.append([labels[i], labels[j]])
    return [n, edges]
