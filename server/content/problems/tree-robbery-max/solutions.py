APPROACHES = {"brute": ("O(2^n)", "O(h)"), "optimal": ("O(n)", "O(h)")}


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
    def rob(node):
        if node is None:
            return 0
        skip = rob(node.left) + rob(node.right)
        take = node.val
        if node.left is not None:
            take += rob(node.left.left) + rob(node.left.right)
        if node.right is not None:
            take += rob(node.right.left) + rob(node.right.right)
        return max(take, skip)

    return rob(root)


def optimal(root):
    def go(node):
        if node is None:
            return 0, 0
        left_take, left_skip = go(node.left)
        right_take, right_skip = go(node.right)
        take = node.val + left_skip + right_skip
        skip = max(left_take, left_skip) + max(right_take, right_skip)
        return take, skip

    return max(go(root))


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 9), 0, 9))]
