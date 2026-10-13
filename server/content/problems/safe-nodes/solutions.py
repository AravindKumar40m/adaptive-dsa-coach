APPROACHES = {"brute": ("O(n * (n + m))", "O(n)"), "optimal": ("O(n + m)", "O(n + m)")}


def brute(graph):
    n = len(graph)

    def reachable(start):
        seen = set()
        stack = list(graph[start])
        while stack:
            u = stack.pop()
            if u in seen:
                continue
            seen.add(u)
            stack.extend(graph[u])
        return seen

    reach = [reachable(i) for i in range(n)]
    on_cycle = [i in reach[i] for i in range(n)]
    return [i for i in range(n) if not on_cycle[i] and not any(on_cycle[j] for j in reach[i])]


def optimal(graph):
    n = len(graph)
    remaining = [len(graph[i]) for i in range(n)]
    reverse = [[] for _ in range(n)]
    for u in range(n):
        for v in graph[u]:
            reverse[v].append(u)
    queue = [i for i in range(n) if remaining[i] == 0]
    safe = [False] * n
    while queue:
        v = queue.pop()
        safe[v] = True
        for u in reverse[v]:
            remaining[u] -= 1
            if remaining[u] == 0:
                queue.append(u)
    return [i for i in range(n) if safe[i]]


def gen(rng):
    n = rng.randint(0, 7)
    return [[sorted(set(rng.randrange(n) for _ in range(rng.randint(0, 2)))) for _ in range(n)]]
