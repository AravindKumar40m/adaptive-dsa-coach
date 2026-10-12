APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(h + k)", "O(h)")}


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


def brute(root, k):
    values = []

    def walk(node):
        if node is None:
            return
        values.append(node.val)
        walk(node.left)
        walk(node.right)

    walk(root)
    return sorted(values)[k - 1]


def optimal(root, k):
    stack = []
    node = root
    while stack or node is not None:
        while node is not None:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    return -1


def gen(rng):
    n = rng.randint(1, 9)
    root = None
    for v in rng.sample(range(-15, 30), n):
        node = [v, None, None]
        if root is None:
            root = node
            continue
        cur = root
        while True:
            side = 1 if v < cur[0] else 2
            if cur[side] is None:
                cur[side] = node
                break
            cur = cur[side]
    return [_levels(root), rng.randint(1, n)]
