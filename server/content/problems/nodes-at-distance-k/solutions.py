APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


def _shape(rng, n, lo, hi):
    if n == 0:
        return None
    left = rng.randint(0, n - 1)
    return (rng.randint(lo, hi), _shape(rng, left, lo, hi), _shape(rng, n - 1 - left, lo, hi))


def _relabel(tree, values):
    if tree is None:
        return None
    return (next(values), _relabel(tree[1], values), _relabel(tree[2], values))


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


def brute(root, target, k):
    neighbours = {}

    def link(a, b):
        neighbours.setdefault(a, []).append(b)
        neighbours.setdefault(b, []).append(a)

    def walk(node):
        neighbours.setdefault(node.val, [])
        for child in (node.left, node.right):
            if child is not None:
                link(node.val, child.val)
                walk(child)

    walk(root)
    seen = {target}
    frontier = [target]
    for _ in range(k):
        nxt = []
        for v in frontier:
            for w in neighbours[v]:
                if w not in seen:
                    seen.add(w)
                    nxt.append(w)
        frontier = nxt
    return len(frontier)


def optimal(root, target, k):
    found = [0]

    def collect(node, depth):
        if node is None:
            return 0
        if depth == 0:
            return 1
        return collect(node.left, depth - 1) + collect(node.right, depth - 1)

    def go(node):
        if node is None:
            return -1
        if node.val == target:
            found[0] += collect(node, k)
            return 0
        left = go(node.left)
        if left != -1:
            dist = left + 1
            if dist == k:
                found[0] += 1
            elif dist < k:
                found[0] += collect(node.right, k - dist - 1)
            return dist
        right = go(node.right)
        if right != -1:
            dist = right + 1
            if dist == k:
                found[0] += 1
            elif dist < k:
                found[0] += collect(node.left, k - dist - 1)
            return dist
        return -1

    go(root)
    return found[0]


def gen(rng):
    n = rng.randint(1, 10)
    labels = list(range(1, n + 1))
    rng.shuffle(labels)
    tree = _relabel(_shape(rng, n, 0, 0), iter(labels))
    return [_levels(tree), rng.choice(labels), rng.randint(0, 5)]
