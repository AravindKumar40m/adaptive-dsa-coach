APPROACHES = {"brute": ("O(n^2)", "O(h)"), "optimal": ("O(n)", "O(h)")}


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
    def chain(node, value):
        if node is None or node.val != value:
            return 0
        return 1 + max(chain(node.left, value), chain(node.right, value))

    def walk(node):
        if node is None:
            return 0
        through = chain(node.left, node.val) + chain(node.right, node.val)
        return max(through, walk(node.left), walk(node.right))

    return walk(root)


def optimal(root):
    best = [0]

    def down(node):
        if node is None:
            return 0
        left = down(node.left)
        right = down(node.right)
        left_arm = left + 1 if node.left is not None and node.left.val == node.val else 0
        right_arm = right + 1 if node.right is not None and node.right.val == node.val else 0
        best[0] = max(best[0], left_arm + right_arm)
        return max(left_arm, right_arm)

    down(root)
    return best[0]


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 11), 1, 2))]
