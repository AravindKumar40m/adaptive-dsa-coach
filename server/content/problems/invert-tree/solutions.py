APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


def brute(root):
    # build a brand new mirrored tree
    if root is None:
        return None
    return TreeNode(root.val, brute(root.right), brute(root.left))


def optimal(root):
    if root is None:
        return None
    root.left, root.right = optimal(root.right), optimal(root.left)
    return root


def random_tree(rng, n, lo=-9, hi=9, unique=False):
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
