APPROACHES = {"brute": ("O(n^2)", "O(n^2)"), "optimal": ("O(n)", "O(n)")}


def brute(preorder, inorder):
    if not preorder:
        return None
    root = TreeNode(preorder[0])
    mid = inorder.index(preorder[0])
    root.left = brute(preorder[1:mid + 1], inorder[:mid])
    root.right = brute(preorder[mid + 1:], inorder[mid + 1:])
    return root


def optimal(preorder, inorder):
    position = {value: i for i, value in enumerate(inorder)}
    next_index = [0]

    def build(lo, hi):
        if lo > hi:
            return None
        value = preorder[next_index[0]]
        next_index[0] += 1
        node = TreeNode(value)
        mid = position[value]
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node

    return build(0, len(inorder) - 1)


def gen(rng):
    n = rng.randint(0, 9)
    values = rng.sample(range(-9, 30), n)
    nodes = []  # [value, left index, right index]
    if n:
        nodes.append([values[0], None, None])
    slots = [(0, 1), (0, 2)] if n else []
    for v in values[1:]:
        index, side = slots.pop(rng.randrange(len(slots)))
        nodes.append([v, None, None])
        nodes[index][side] = len(nodes) - 1
        slots += [(len(nodes) - 1, 1), (len(nodes) - 1, 2)]
    pre, ino = [], []

    def walk(k):
        if k is None:
            return
        pre.append(nodes[k][0])
        walk(nodes[k][1])
        ino.append(nodes[k][0])
        walk(nodes[k][2])

    if n:
        walk(0)
    return [pre, ino]
