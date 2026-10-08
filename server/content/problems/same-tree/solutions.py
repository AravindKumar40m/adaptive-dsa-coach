APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


def brute(first, second):
    def serialize(root):
        out, queue = [], [root]
        for node in queue:
            if node is None:
                out.append(None)
            else:
                out.append(node.val)
                queue.append(node.left)
                queue.append(node.right)
        return out

    return serialize(first) == serialize(second)


def optimal(first, second):
    if first is None and second is None:
        return True
    if first is None or second is None:
        return False
    return first.val == second.val and optimal(first.left, second.left) and optimal(first.right, second.right)


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
    first = random_tree(rng, rng.randint(0, 5), 0, 3)
    if rng.random() < 0.5:
        return [first, list(first)]  # identical
    return [first, random_tree(rng, rng.randint(0, 5), 0, 3)]
