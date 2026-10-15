APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


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
    total = 0
    stack = [(root, False)]
    while stack:
        node, is_left = stack.pop()
        if node is None:
            continue
        if node.left is None and node.right is None and is_left:
            total += node.val
        stack.append((node.left, True))
        stack.append((node.right, False))
    return total


def optimal(root):
    def walk(node):
        if node is None:
            return 0
        total = 0
        if node.left is not None and node.left.left is None and node.left.right is None:
            total += node.left.val
        else:
            total += walk(node.left)
        return total + walk(node.right)

    return walk(root)


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 10), -5, 9))]
