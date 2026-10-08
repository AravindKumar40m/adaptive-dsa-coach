APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


def brute(root):
    values = []

    def inorder(node):
        if node:
            inorder(node.left)
            values.append(node.val)
            inorder(node.right)

    inorder(root)
    return all(values[i] < values[i + 1] for i in range(len(values) - 1))


def optimal(root):
    def check(node, low, high):
        if node is None:
            return True
        if (low is not None and node.val <= low) or (high is not None and node.val >= high):
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, None, None)


def level_order(nodes):
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


def random_tree(rng, n, lo=0, hi=12):
    values = [rng.randint(lo, hi) for _ in range(n)]
    nodes = [[values[0], None, None]]
    slots = [(0, 1), (0, 2)]
    for v in values[1:]:
        index, side = slots.pop(rng.randrange(len(slots)))
        nodes.append([v, None, None])
        nodes[index][side] = len(nodes) - 1
        slots += [(len(nodes) - 1, 1), (len(nodes) - 1, 2)]
    return level_order(nodes)


def bst_tree(rng, n, lo=0, hi=20):
    values = rng.sample(range(lo, hi + 1), n)
    nodes = [[values[0], None, None]]
    for v in values[1:]:
        cur = 0
        while True:
            side = 1 if v < nodes[cur][0] else 2
            if nodes[cur][side] is None:
                nodes.append([v, None, None])
                nodes[cur][side] = len(nodes) - 1
                break
            cur = nodes[cur][side]
    return level_order(nodes)


def gen(rng):
    if rng.random() < 0.4:
        return [random_tree(rng, rng.randint(1, 7))]
    tree = bst_tree(rng, rng.randint(1, 8))  # a valid BST...
    if len(tree) >= 2 and rng.random() < 0.5:  # ...often damaged by overwriting one value
        spots = [i for i, v in enumerate(tree) if v is not None]
        tree[rng.choice(spots)] = rng.randint(0, 20)
    return [tree]
