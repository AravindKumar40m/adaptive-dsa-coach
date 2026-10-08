APPROACHES = {"brute": ("O(n * m)", "O(n)"), "optimal": ("O(n + m)", "O(n)")}


def brute(n, friendships):
    # label propagation: every user starts with their own label, friends keep copying the smaller one until nothing changes
    label = list(range(n))
    changed = True
    while changed:
        changed = False
        for a, b in friendships:
            low = min(label[a], label[b])
            if label[a] != low or label[b] != low:
                label[a] = label[b] = low
                changed = True
    return len(set(label))


def optimal(n, friendships):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    groups = n
    for a, b in friendships:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            groups -= 1
    return groups


def gen(rng):
    n = rng.randint(1, 10)
    return [n, [[rng.randrange(n), rng.randrange(n)] for _ in range(rng.randint(0, 12))]]
