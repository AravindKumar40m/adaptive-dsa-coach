APPROACHES = {"brute": ("O(n^2)", "O(h)"), "optimal": ("O(n)", "O(h)")}


def brute(root):
    def chain(node):  # best sum of a path that starts at node and only goes downward
        if node is None:
            return 0
        return node.val + max(0, chain(node.left), chain(node.right))

    best = None

    def visit(node):
        nonlocal best
        if node is None:
            return
        total = node.val + max(0, chain(node.left)) + max(0, chain(node.right))
        best = total if best is None else max(best, total)
        visit(node.left)
        visit(node.right)

    visit(root)
    return best


def optimal(root):
    best = [None]

    def gain(node):
        if node is None:
            return 0
        left = max(0, gain(node.left))
        right = max(0, gain(node.right))
        total = node.val + left + right
        if best[0] is None or total > best[0]:
            best[0] = total
        return node.val + max(left, right)

    gain(root)
    return best[0]


def random_tree(rng, n, lo=-9, hi=9, unique=False):
    values = [rng.randint(lo, hi) for _ in range(n)]
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
    return [random_tree(rng, rng.randint(1, 10))]
