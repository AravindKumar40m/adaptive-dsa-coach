APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(w)")}


def brute(root):
    # depth-first: add every value into the total of its depth
    sums = {}

    def visit(node, depth):
        if node is None:
            return
        sums[depth] = sums.get(depth, 0) + node.val
        visit(node.left, depth + 1)
        visit(node.right, depth + 1)

    visit(root, 0)
    return [sums[d] for d in range(len(sums))]


def optimal(root):
    if root is None:
        return []
    result = []
    level = [root]
    while level:
        result.append(sum(node.val for node in level))
        level = [child for node in level for child in (node.left, node.right) if child]
    return result


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
    return [random_tree(rng, rng.randint(0, 10))]
