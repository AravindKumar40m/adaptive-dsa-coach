APPROACHES = {"brute": ("O(n * (n + m))", "O(n)"), "optimal": ("O(n + m)", "O(n + m)")}


def brute(n, prerequisites):
    remaining = set(range(n))
    edges = [tuple(e) for e in prerequisites]
    progress = True
    while progress:
        progress = False
        for course in list(remaining):
            if not any(a == course and b in remaining for a, b in edges):
                remaining.remove(course)
                progress = True
    return not remaining


def optimal(n, prerequisites):
    indegree = [0] * n
    needs = [[] for _ in range(n)]
    for a, b in prerequisites:
        needs[b].append(a)
        indegree[a] += 1
    queue = [c for c in range(n) if indegree[c] == 0]
    taken = 0
    for c in queue:
        taken += 1
        for x in needs[c]:
            indegree[x] -= 1
            if indegree[x] == 0:
                queue.append(x)
    return taken == n


def gen(rng):
    n = rng.randint(1, 6)
    edges = []
    for _ in range(rng.randint(0, 8)):
        a, b = rng.randrange(n), rng.randrange(n)
        if a != b:
            edges.append([a, b])
    return [n, edges]
