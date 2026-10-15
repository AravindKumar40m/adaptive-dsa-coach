APPROACHES = {"brute": ("O(n)", "O(h)"), "optimal": ("O(n)", "O(w)")}


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
    def depth(node):
        if node is None:
            return 0
        if node.left is None:
            return 1 + depth(node.right)
        if node.right is None:
            return 1 + depth(node.left)
        return 1 + min(depth(node.left), depth(node.right))

    return depth(root)


def optimal(root):
    if root is None:
        return 0
    queue = [(root, 1)]
    for node, level in queue:
        if node.left is None and node.right is None:
            return level
        if node.left is not None:
            queue.append((node.left, level + 1))
        if node.right is not None:
            queue.append((node.right, level + 1))


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 10), 0, 9))]
