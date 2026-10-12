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


def _leaf_sums(t, acc=0):
    if t is None:
        return []
    acc += t[0]
    if t[1] is None and t[2] is None:
        return [acc]
    return _leaf_sums(t[1], acc) + _leaf_sums(t[2], acc)


def brute(root, target):
    sums = []

    def walk(node, acc):
        if node is None:
            return
        acc += node.val
        if node.left is None and node.right is None:
            sums.append(acc)
        walk(node.left, acc)
        walk(node.right, acc)

    walk(root, 0)
    return target in sums


def optimal(root, target):
    def go(node, left):
        if node is None:
            return False
        if node.left is None and node.right is None:
            return node.val == left
        return go(node.left, left - node.val) or go(node.right, left - node.val)

    return go(root, target)


def gen(rng):
    tree = _shape(rng, rng.randint(0, 9), -4, 9)
    sums = _leaf_sums(tree)
    if sums and rng.random() < 0.55:
        target = rng.choice(sums)
    else:
        target = rng.randint(-6, 25)
    return [_levels(tree), target]
