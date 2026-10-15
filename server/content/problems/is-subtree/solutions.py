APPROACHES = {"brute": ("O(n * m)", "O(h)"), "optimal": ("O(n + m)", "O(n + m)")}


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


def _subtrees(tree):
    if tree is None:
        return []
    return [tree] + _subtrees(tree[1]) + _subtrees(tree[2])


def brute(root, sub):
    def same(a, b):
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)

    def search(node):
        if node is None:
            return sub is None
        return same(node, sub) or search(node.left) or search(node.right)

    return search(root)


def optimal(root, sub):
    def text(node):
        parts = []
        stack = [node]
        while stack:
            cur = stack.pop()
            if cur is None:
                parts.append("#")
            else:
                parts.append("^" + str(cur.val))
                stack.append(cur.right)
                stack.append(cur.left)
        return "," + ",".join(parts) + ","

    return text(sub) in text(root)


def gen(rng):
    big = _shape(rng, rng.randint(0, 9), 1, 3)
    if rng.random() < 0.5 and big is not None:
        small = rng.choice(_subtrees(big))
        if rng.random() < 0.3:
            small = (small[0], small[1], None if small[2] is not None else (1, None, None))
    else:
        small = _shape(rng, rng.randint(0, 3), 1, 3)
    return [_levels(big), _levels(small)]
