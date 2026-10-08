APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


def brute(root, p, q):
    def path(node, target):
        if node is None:
            return None
        if node.val == target:
            return [node.val]
        for child in (node.left, node.right):
            below = path(child, target)
            if below is not None:
                return [node.val] + below
        return None

    path_p, path_q = path(root, p), path(root, q)
    lca = None
    for a, b in zip(path_p, path_q):
        if a != b:
            break
        lca = a
    return lca


def optimal(root, p, q):
    def find(node):
        if node is None or node.val == p or node.val == q:
            return node
        left, right = find(node.left), find(node.right)
        if left and right:
            return node
        return left or right

    return find(root).val


def random_tree(rng, n, lo=-9, hi=30, unique=True):
    values = rng.sample(range(lo, hi + 1), n)
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
    tree = random_tree(rng, rng.randint(1, 9))
    present = [v for v in tree if v is not None]
    return [tree, rng.choice(present), rng.choice(present)]
