APPROACHES = {"brute": ("O(2^n * m)", "O(1)"), "optimal": ("O(n + m)", "O(n + m)")}


def brute(people, conflicts):
    for mask in range(1 << people):
        if all((mask >> a & 1) != (mask >> b & 1) for a, b in conflicts):
            return True
    return False


def optimal(people, conflicts):
    adj = [[] for _ in range(people)]
    for a, b in conflicts:
        adj[a].append(b)
        adj[b].append(a)
    side = [-1] * people
    for s in range(people):
        if side[s] != -1:
            continue
        side[s] = 0
        queue = [s]
        for u in queue:
            for v in adj[u]:
                if side[v] == -1:
                    side[v] = 1 - side[u]
                    queue.append(v)
                elif side[v] == side[u]:
                    return False
    return True


def gen(rng):
    people = rng.randint(1, 9)
    edges = []
    if people >= 2:
        for _ in range(rng.randint(0, 12)):
            a, b = rng.sample(range(people), 2)
            edges.append([a, b])
    if rng.random() < 0.5:
        team = [rng.randint(0, 1) for _ in range(people)]
        edges = [e for e in edges if team[e[0]] != team[e[1]]]
    return [people, edges]
