APPROACHES = {"brute": ("exponential", "O(n)"), "optimal": ("O(n * (n + m))", "O(n + m)")}


def brute(n, edges):
    adjacent = [set() for _ in range(n)]
    for a, b in edges:
        adjacent[a].add(b)
        adjacent[b].add(a)
    best = [0]

    def walk(start, node, visited, length):
        for nxt in adjacent[node]:
            if nxt == start and length >= 3:
                if best[0] == 0 or length < best[0]:
                    best[0] = length
            elif nxt > start and nxt not in visited:
                visited.add(nxt)
                walk(start, nxt, visited, length + 1)
                visited.remove(nxt)

    for s in range(n):
        walk(s, s, {s}, 1)
    return best[0] if best[0] else -1


def optimal(n, edges):
    from collections import deque

    adjacent = [[] for _ in range(n)]
    for a, b in edges:
        adjacent[a].append(b)
        adjacent[b].append(a)
    best = 10 ** 9
    for s in range(n):
        dist = [-1] * n
        parent = [-1] * n
        dist[s] = 0
        queue = deque([s])
        while queue:
            u = queue.popleft()
            for v in adjacent[u]:
                if dist[v] == -1:
                    dist[v] = dist[u] + 1
                    parent[v] = u
                    queue.append(v)
                elif parent[u] != v:
                    best = min(best, dist[u] + dist[v] + 1)
    return -1 if best == 10 ** 9 else best


def gen(rng):
    n = rng.randint(3, 7)
    pairs = [[a, b] for a in range(n) for b in range(a + 1, n)]
    rng.shuffle(pairs)
    return [n, pairs[:rng.randint(0, n + 1)]]
