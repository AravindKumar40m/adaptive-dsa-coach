APPROACHES = {"brute": ("O(n * (n + m))", "O(n^2)"), "optimal": ("O(n + m)", "O(n + m)")}


def brute(n, edges):
    forward = [[] for _ in range(n)]
    for a, b in edges:
        forward[a].append(b)

    def reach(start):
        seen = {start}
        stack = [start]
        while stack:
            u = stack.pop()
            for v in forward[u]:
                if v not in seen:
                    seen.add(v)
                    stack.append(v)
        return seen

    reachable = [reach(i) for i in range(n)]
    components = set()
    for i in range(n):
        components.add(frozenset(j for j in reachable[i] if i in reachable[j]))
    return len(components)


def optimal(n, edges):
    forward = [[] for _ in range(n)]
    backward = [[] for _ in range(n)]
    for a, b in edges:
        forward[a].append(b)
        backward[b].append(a)
    visited = [False] * n
    order = []
    for start in range(n):
        if visited[start]:
            continue
        visited[start] = True
        stack = [(start, 0)]
        while stack:
            u, i = stack.pop()
            if i < len(forward[u]):
                stack.append((u, i + 1))
                v = forward[u][i]
                if not visited[v]:
                    visited[v] = True
                    stack.append((v, 0))
            else:
                order.append(u)
    visited = [False] * n
    count = 0
    for start in reversed(order):
        if visited[start]:
            continue
        count += 1
        visited[start] = True
        stack = [start]
        while stack:
            u = stack.pop()
            for v in backward[u]:
                if not visited[v]:
                    visited[v] = True
                    stack.append(v)
    return count


def gen(rng):
    n = rng.randint(1, 7)
    return [n, [[rng.randrange(n), rng.randrange(n)] for _ in range(rng.randint(0, 10))]]
