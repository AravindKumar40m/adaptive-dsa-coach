APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


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


def _flip(t):
    return None if t is None else (t[0], _flip(t[2]), _flip(t[1]))


def brute(root):
    def flipped(node):
        return None if node is None else (node.val, flipped(node.right), flipped(node.left))

    def plain(node):
        return None if node is None else (node.val, plain(node.left), plain(node.right))

    return root is None or plain(root.left) == flipped(root.right)


def optimal(root):
    def same(a, b):
        if a is None or b is None:
            return a is b
        return a.val == b.val and same(a.left, b.right) and same(a.right, b.left)

    return root is None or same(root.left, root.right)


def gen(rng):
    if rng.random() < 0.5:
        half = _shape(rng, rng.randint(0, 4), 0, 3)
        tree = (rng.randint(0, 3), half, _flip(half))
        if rng.random() < 0.35:
            tree = (tree[0], tree[1], _shape(rng, rng.randint(0, 4), 0, 3))
    else:
        tree = _shape(rng, rng.randint(0, 9), 0, 3)
    return [_levels(tree)]
