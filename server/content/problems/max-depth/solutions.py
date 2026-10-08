APPROACHES = {"brute": ("O(n)", "O(w)"), "optimal": ("O(n)", "O(h)")}


def brute(root):
    # count levels with a breadth-first walk
    if root is None:
        return 0
    level = [root]
    depth = 0
    while level:
        depth += 1
        level = [child for node in level for child in (node.left, node.right) if child]
    return depth


def optimal(root):
    if root is None:
        return 0
    return 1 + max(optimal(root.left), optimal(root.right))


def random_tree(rng, n, lo=-9, hi=9, unique=False):
    """A random binary tree with n nodes, as a level-order list (None = missing child)."""
    if n == 0:
        return []
    values = rng.sample(range(lo, hi + 1), n) if unique else [rng.randint(lo, hi) for _ in range(n)]
    nodes = [[values[0], None, None]]
    slots = [(0, 1), (0, 2)]
    for v in values[1:]:
        index, side = slots.pop(rng.randrange(len(slots)))
        nodes.append([v, None, None])
        nodes[index][side] = len(nodes) - 1
        slots += [(len(nodes) - 1, 1), (len(nodes) - 1, 2)]
    out, queue = [], [0]
    for k in queue:
        if k is None:
            out.append(None)
        else:
            out.append(nodes[k][0])
            queue.append(nodes[k][1])
            queue.append(nodes[k][2])
    while out and out[-1] is None:
        out.pop()
    return out


def gen(rng):
    return [random_tree(rng, rng.randint(0, 9))]
