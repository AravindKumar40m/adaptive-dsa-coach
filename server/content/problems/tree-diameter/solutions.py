APPROACHES = {"brute": ("O(n^2)", "O(h)"), "optimal": ("O(n)", "O(h)")}


def brute(root):
    def height(node):
        return 0 if node is None else 1 + max(height(node.left), height(node.right))

    best = 0

    def visit(node):
        nonlocal best
        if node is None:
            return
        best = max(best, height(node.left) + height(node.right))
        visit(node.left)
        visit(node.right)

    visit(root)
    return best


def optimal(root):
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        left, right = height(node.left), height(node.right)
        best = max(best, left + right)
        return 1 + max(left, right)

    height(root)
    return best


def random_tree(rng, n, lo=-9, hi=9, unique=False):
    if n == 0:
        return []
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
    return [random_tree(rng, rng.randint(0, 11))]
