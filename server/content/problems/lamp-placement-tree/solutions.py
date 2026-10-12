APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


def _shape(rng, n, lo, hi):
    if n == 0:
        return None
    left = rng.randint(0, n - 1)
    return (rng.randint(lo, hi), _shape(rng, left, lo, hi), _shape(rng, n - 1 - left, lo, hi))


def _levels(tree):
    out, queue = [], [tree]
    for node in queue:
        if node is None:
            out.append(None)
        else:
            out.append(node[0])
            queue.append(node[1])
            queue.append(node[2])
    while out and out[-1] is None:
        out.pop()
    return out


def brute(root):
    from itertools import combinations

    if root is None:
        return 0
    ids = {}
    queue = [root]
    for node in queue:
        ids[id(node)] = len(ids)
        for child in (node.left, node.right):
            if child is not None:
                queue.append(child)
    n = len(ids)
    close = [{i} for i in range(n)]
    for node in queue:
        for child in (node.left, node.right):
            if child is not None:
                a, b = ids[id(node)], ids[id(child)]
                close[a].add(b)
                close[b].add(a)
    for size in range(1, n + 1):
        for chosen in combinations(range(n), size):
            lit = set()
            for c in chosen:
                lit |= close[c]
            if len(lit) == n:
                return size
    return n


def optimal(root):
    lamps = [0]

    def state(node):
        if node is None:
            return 2
        left, right = state(node.left), state(node.right)
        if left == 0 or right == 0:
            lamps[0] += 1
            return 1
        if left == 1 or right == 1:
            return 2
        return 0

    if state(root) == 0:
        lamps[0] += 1
    return lamps[0]


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 10), 0, 0))]
